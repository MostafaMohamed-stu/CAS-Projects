using System.Collections.Generic;

namespace SchoolAdmission.DTOs;

public class ExportStudentsRequestDTO
{
    public List<string>? Columns { get; set; }
}

public class ExportColumnDefinitionDTO
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool DefaultSelected { get; set; } = true;
}

