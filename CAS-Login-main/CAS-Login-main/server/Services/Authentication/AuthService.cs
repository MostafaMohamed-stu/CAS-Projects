using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CAS_Login_Back_End.Data;
using CAS_Login_Back_End.Services.Interfaces;
using CAS_Login_Back_End.Models.Responses;
using CAS_Login_Back_End.Models.Authentication;
using CAS_Login_Back_End.Models.Configuration;
using CAS_Login_Back_End.Exceptions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CAS_Login_Back_End.Services.Authentication
{
    public class AuthService : IAuthService
    {
        private readonly CasDbContext _dbContext;
        private readonly ITokenService _tokenService;
        private readonly IPasswordService _passwordService;
        private readonly IAccountIdentityService _accountIdentityService;
        private readonly IBusinessEntityAuthorizationService _businessEntityAuthorizationService;
        private readonly ITokenRevocationService _tokenRevocationService;
        private readonly JwtOptions _jwtOptions;

        public AuthService(
            CasDbContext dbContext,
            ITokenService tokenService,
            IPasswordService passwordService,
            IAccountIdentityService accountIdentityService,
            IBusinessEntityAuthorizationService businessEntityAuthorizationService,
            ITokenRevocationService tokenRevocationService,
            IOptions<JwtOptions> jwtOptions)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
            _passwordService = passwordService ?? throw new ArgumentNullException(nameof(passwordService));
            _accountIdentityService = accountIdentityService ?? throw new ArgumentNullException(nameof(accountIdentityService));
            _businessEntityAuthorizationService = businessEntityAuthorizationService
                ?? throw new ArgumentNullException(nameof(businessEntityAuthorizationService));
            _tokenRevocationService = tokenRevocationService
                ?? throw new ArgumentNullException(nameof(tokenRevocationService));
            _jwtOptions = jwtOptions?.Value ?? throw new ArgumentNullException(nameof(jwtOptions));
        }

        public async Task<LoginResponse> LoginAsync(
            string email,
            string password,
            long businessEntityId,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ValidationException("Email is required.");

            if (string.IsNullOrWhiteSpace(password))
                throw new ValidationException("Password is required.");

            if (businessEntityId <= 0)
                throw new ValidationException("Business entity ID is required.");

            // Login is the single credential source. Profile data is resolved
            // from Account_Info by the Login.AccountId after authentication.
            var login = await _dbContext.Logins
                .AsNoTracking()
                .SingleOrDefaultAsync(l => l.Email == email, cancellationToken);

            if (login is null)
                throw new UnauthorizedException("Invalid email or password.");

            var account = await GetActiveAccountInfoAsync(login.AccountId, cancellationToken);

            if (!account.IsActive)
                throw new UnauthorizedException("Account is inactive.");

            if (!_passwordService.Verify(password, login.PasswordHash))
                throw new UnauthorizedException("Invalid email or password.");

            var businessEntity = await _businessEntityAuthorizationService.GetAuthorizedAsync(
                account.Id, businessEntityId, cancellationToken);

            var ssoToken = _tokenService.GenerateSsoToken(account.Id, account.NationalId);
            var ssoTokenId = GetRequiredTokenId(_tokenService.GetPrincipal(ssoToken));

            var jwtCreatedAt = DateTime.UtcNow;
            var jwtToken = _tokenService.GenerateSystemToken(
                new SystemTokenDescriptor
                {
                    AccountId = account.Id,
                    Email = account.Email,
                    NationalId = account.NationalId,
                    Phone = account.Phone,
                    City = account.City,
                    FullNameEn = account.FullNameEn ?? string.Empty,
                    FullNameAr = account.FullNameAr ?? string.Empty,
                    AccountCreatedAt = account.CreatedAt,
                    CreatedAt = jwtCreatedAt,
                    IsActive = account.IsActive,
                    StatusId = account.StatusId,
                    GovernoratesId = account.GovernoratesId,
                    SsoTokenId = ssoTokenId,
                    BusinessEntityId = businessEntity.Id,
                    BusinessEntityName = businessEntity.Name,
                    RedirectUrl = businessEntity.RedirectUrl ?? string.Empty,
                    Role = businessEntity.RoleName
                });

            return new LoginResponse
            {
                SsoToken = ssoToken,
                JwtToken = jwtToken,

                AccountId = account.Id,
                Email = account.Email,
                FullNameEn = account.FullNameEn ?? string.Empty,
                FullNameAr = account.FullNameAr ?? string.Empty,

                Role = businessEntity.RoleName,

                BusinessEntityId = businessEntity.Id,
                BusinessEntityName = businessEntity.Name,
                RedirectUrl = businessEntity.RedirectUrl ?? string.Empty,

                SsoExpiresAt = jwtCreatedAt.AddHours(_jwtOptions.SsoExpirationHours),
                JwtCreatedAt = jwtCreatedAt,
                JwtExpiresAt = jwtCreatedAt.AddMinutes(_jwtOptions.ExpirationMinutes)
            };
        }

        public async Task<ExchangeTokenResponse> ExchangeTokenAsync(
            string ssoToken,
            long businessEntityId,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(ssoToken))
                throw new ValidationException("Authorization token is required.");

            if (businessEntityId <= 0)
                throw new ValidationException("Business entity ID is required.");

            ClaimsPrincipal principal;

            try
            {
                principal = _tokenService.GetPrincipal(ssoToken);
            }
            catch (Exception)
            {
                throw new UnauthorizedException("Invalid or expired authorization token.");
            }

            var tokenType = principal.FindFirst("TokenType")?.Value;
            if (!string.Equals(tokenType, "SSO", StringComparison.Ordinal) &&
                !string.Equals(tokenType, "System", StringComparison.Ordinal))
            {
                throw new UnauthorizedException("Token type is not supported.");
            }

            var ssoTokenId = string.Equals(tokenType, "SSO", StringComparison.Ordinal)
                ? GetRequiredTokenId(principal)
                : GetRequiredSsoTokenId(principal);

            var accountId = await _accountIdentityService.ResolveAccountIdAsync(principal, cancellationToken);
            if (!accountId.HasValue)
                throw new UnauthorizedException("Invalid authorization token claims.");

            var login = await _dbContext.Logins
                .AsNoTracking()
                .SingleOrDefaultAsync(login => login.AccountId == accountId.Value, cancellationToken)
                ?? throw new UnauthorizedException("Login record not found.");

            var account = await GetActiveAccountInfoAsync(login.AccountId, cancellationToken);

            var businessEntity = await _businessEntityAuthorizationService.GetAuthorizedAsync(
                account.Id, businessEntityId, cancellationToken);

            var jwtCreatedAt = DateTime.UtcNow;
            var jwtToken = _tokenService.GenerateSystemToken(new SystemTokenDescriptor
            {
                AccountId = account.Id,
                Email = account.Email,
                NationalId = account.NationalId,
                Phone = account.Phone,
                City = account.City,
                FullNameEn = account.FullNameEn ?? string.Empty,
                FullNameAr = account.FullNameAr ?? string.Empty,
                AccountCreatedAt = account.CreatedAt,
                CreatedAt = jwtCreatedAt,
                IsActive = account.IsActive,
                StatusId = account.StatusId,
                GovernoratesId = account.GovernoratesId,
                SsoTokenId = ssoTokenId,
                BusinessEntityId = businessEntity.Id,
                BusinessEntityName = businessEntity.Name,
                RedirectUrl = businessEntity.RedirectUrl ?? string.Empty,
                Role = businessEntity.RoleName
            });

            return new ExchangeTokenResponse
            {
                JwtToken = jwtToken,
                Role = businessEntity.RoleName,
                BusinessEntityId = businessEntity.Id,
                BusinessEntityName = businessEntity.Name,
                RedirectUrl = businessEntity.RedirectUrl ?? string.Empty,
                JwtCreatedAt = jwtCreatedAt,
                JwtExpiresAt = jwtCreatedAt.AddMinutes(_jwtOptions.ExpirationMinutes)
            };
        }

        public async Task<ValidateTokenResponse> ValidateTokenAsync(
            string token,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(token))
                return new ValidateTokenResponse { IsValid = false };

            ClaimsPrincipal principal;

            try
            {
                principal = _tokenService.GetPrincipal(token);
            }
            catch (SecurityTokenExpiredException)
            {
                return new ValidateTokenResponse { IsValid = false, IsExpired = true };
            }
            catch (Exception)
            {
                return new ValidateTokenResponse { IsValid = false };
            }

            var accountId = await _accountIdentityService.ResolveAccountIdAsync(principal, cancellationToken);
            if (!accountId.HasValue)
                return new ValidateTokenResponse { IsValid = false };

            return new ValidateTokenResponse
            {
                IsValid = true,
                IsExpired = false,
                TokenType = principal.FindFirst("TokenType")?.Value ?? string.Empty,
                AccountId = accountId.Value,
                CreatedAt = ReadCreatedAt(principal)
            };
        }

        public async Task<LogoutResponse> LogoutAsync(
            string systemToken,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(systemToken))
                throw new ValidationException("System JWT is required.");

            ClaimsPrincipal systemPrincipal;

            try
            {
                systemPrincipal = _tokenService.GetPrincipal(systemToken);
            }
            catch (Exception)
            {
                throw new UnauthorizedException("Invalid, expired, or revoked authorization token.");
            }

            if (!string.Equals(systemPrincipal.FindFirst("TokenType")?.Value, "System", StringComparison.Ordinal))
                throw new UnauthorizedException("Authorization header must contain a system JWT.");

            var tokenBusinessEntityId = GetRequiredBusinessEntityId(systemPrincipal);

            var systemTokenId = GetRequiredTokenId(systemPrincipal);
            var systemExpiresAt = _tokenService.ReadExpiration(systemToken);

            if (!systemExpiresAt.HasValue)
                throw new UnauthorizedException("Authorization token expiration is missing.");

            string? ssoTokenId = null;
            DateTime? ssoExpiresAt = null;

            var linkedSsoTokenId = systemPrincipal.FindFirst("SsoTokenId")?.Value;
            if (!string.IsNullOrWhiteSpace(linkedSsoTokenId))
            {
                ssoTokenId = linkedSsoTokenId;
                var createdAt = ReadCreatedAt(systemPrincipal);
                if (createdAt.HasValue)
                {
                    ssoExpiresAt = createdAt.Value.AddHours(_jwtOptions.SsoExpirationHours);
                }
            }

            _tokenRevocationService.Revoke(systemTokenId, systemExpiresAt.Value);

            if (!string.IsNullOrWhiteSpace(ssoTokenId) && ssoExpiresAt.HasValue)
                _tokenRevocationService.Revoke(ssoTokenId, ssoExpiresAt.Value);

            return new LogoutResponse
            {
                BusinessEntityId = tokenBusinessEntityId,
                JwtTokenRevoked = true,
                SsoTokenRevoked = !string.IsNullOrWhiteSpace(ssoTokenId)
            };
        }

        private async Task<Data.Entities.AccountInfo> GetActiveAccountInfoAsync(
            long accountId,
            CancellationToken cancellationToken)
        {
            var account = await _dbContext.AccountInfos
                .AsNoTracking()
                .SingleOrDefaultAsync(account => account.Id == accountId, cancellationToken)
                ?? throw new UnauthorizedException("Account profile not found.");

            if (!account.IsActive)
                throw new UnauthorizedException("Account is inactive.");

            return account;
        }

        private static DateTime? ReadCreatedAt(ClaimsPrincipal principal)
        {
            return ReadDateTimeClaim(principal, "CreatedAt");
        }

        private static DateTime? ReadDateTimeClaim(ClaimsPrincipal principal, string claimType)
        {
            var value = principal.FindFirst(claimType)?.Value;

            return DateTime.TryParse(
                value,
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.RoundtripKind,
                out var dateTime)
                ? dateTime
                : null;
        }

        private static string GetRequiredTokenId(ClaimsPrincipal principal)
        {
            var tokenId = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value
                ?? principal.FindFirst(ClaimTypes.SerialNumber)?.Value;

            if (string.IsNullOrWhiteSpace(tokenId))
                throw new UnauthorizedException("Authorization token cannot be revoked. Sign in again and retry.");

            return tokenId;
        }

        private static string GetRequiredSsoTokenId(ClaimsPrincipal principal)
        {
            var ssoTokenId = principal.FindFirst("SsoTokenId")?.Value;

            if (string.IsNullOrWhiteSpace(ssoTokenId))
                throw new UnauthorizedException("System JWT is missing its SSO session. Sign in again and retry.");

            return ssoTokenId;
        }

        private static long GetRequiredBusinessEntityId(ClaimsPrincipal principal)
        {
            var value = principal.FindFirst("BusinessEntityId")?.Value;

            if (!long.TryParse(value, out var businessEntityId) || businessEntityId <= 0)
                throw new UnauthorizedException("System JWT business entity is invalid.");

            return businessEntityId;
        }
    }
}
