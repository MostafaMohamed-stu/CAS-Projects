namespace SchoolAdmission.DTOs;

public class PaginationRequestDTO
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public string? StatusFilter { get; set; }
    public string? SortBy { get; set; } = "name";
    public string? SortOrder { get; set; } = "asc";
}

public class PaginationResponseDTO<T>
{
    public List<T> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
}
