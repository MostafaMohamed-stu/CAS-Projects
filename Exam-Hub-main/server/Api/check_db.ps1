$conn = New-Object System.Data.SqlClient.SqlConnection("Data Source=DESKTOP-TGVGGP9;database=ElsewedySchoolSysDB_DEV;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False");
try {
    $conn.Open();
    $cmd = $conn.CreateCommand();
    
    Write-Host "--- Roles Table ---"
    $cmd.CommandText = "SELECT Id, RoleName FROM Roles";
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd);
    $data = New-Object System.Data.DataTable;
    [void]$adapter.Fill($data);
    $data | Select-Object Id, RoleName | Format-Table | Out-String | Write-Host

    Write-Host "`n--- Teacher Count (Direct Account.RoleId) ---"
    $cmd.CommandText = "SELECT COUNT(*) FROM Account WHERE RoleId IN (SELECT Id FROM Roles WHERE RoleName = 'Teacher')";
    $count = $cmd.ExecuteScalar();
    Write-Host "Count: $count"

    Write-Host "`n--- Teacher Count (AccountRoles Table) ---"
    $cmd.CommandText = "SELECT COUNT(*) FROM AccountRoles ar JOIN Roles r ON ar.RoleID = r.Id WHERE r.RoleName = 'Teacher'";
    $countJoin = $cmd.ExecuteScalar();
    Write-Host "Count: $countJoin"

    if ($count -gt 0 -or $countJoin -gt 0) {
        Write-Host "`n--- Sample Teachers ---"
        $cmd.CommandText = "SELECT TOP 5 FullNameEN, Email FROM Account WHERE RoleId IN (SELECT Id FROM Roles WHERE RoleName = 'Teacher') OR Id IN (SELECT AccountID FROM AccountRoles ar JOIN Roles r ON ar.RoleID = r.Id WHERE r.RoleName = 'Teacher')";
        $adapter2 = New-Object System.Data.SqlClient.SqlDataAdapter($cmd);
        $data2 = New-Object System.Data.DataTable;
        [void]$adapter2.Fill($data2);
        $data2 | Select-Object FullNameEN, Email | Format-Table | Out-String | Write-Host
    }

} catch {
    Write-Error $_.Exception.Message
} finally {
    $conn.Close();
}
