/** Deploy title SL_CSV_Parse
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/file", "N/log", "N/record", "N/search", "N/runtime"], (serverWidget, file, log, record, search, runtime) => {
  const onRequest = (scriptContext) => {
    const { request, response } = scriptContext;
    const SL_Form = serverWidget.createForm({ title: "CSV File Upload and Parse" });

    // Create the sublist to display parsed CSV data
    const SL_Sub_List = SL_Form.addSublist({ id: "custpage_parsed_csv_sublist", type: serverWidget.SublistType.LIST, label: "Parsed CSV Data" });
    // Field for Total Count
    const SL_RecordCountLabel = SL_Form.addField({ id: "custpage_record_count", type: serverWidget.FieldType.INLINEHTML, label: "Total Records" });

    // Handle the form submission (POST)
    if (request.method === "POST") {
      // Get the uploaded file ID from the form
      const uploadedFile = request.files["custpage_file_upload"];
      uploadedFile.folder = -15;
      var uploadedFileId = uploadedFile.save();
      log.debug("Uploaded File ID", uploadedFileId);

      // Ensure the file exists before proceeding
      if (!uploadedFileId) {
        log.error("File Upload Error", "No file uploaded or file ID is invalid.");
        SL_RecordCountLabel.defaultValue = "<b>Error: No file uploaded or file ID is invalid.</b>";
        response.writePage(SL_Form);
        return;
      }

      try {
        const uploadedFile = file.load({ id: uploadedFileId });
        log.debug("File Loaded", uploadedFile.name); // Log file details
        const csvData = uploadedFile.getContents();

        // Validate file type
        if (uploadedFile.fileType !== file.Type.CSV) {
          log.error("Invalid File Type", "The uploaded file is not a CSV file.");
          SL_RecordCountLabel.defaultValue = "<b>Error: Please upload a CSV file.</b>";
          response.writePage(SL_Form);
          return;
        }

        // Process the CSV data
        const parsedData = parseCSV(csvData);

        // Dynamically create sublist columns based on the CSV headers
        const csvHeaders = parsedData[0]; // First row contains headers
        csvHeaders.forEach((header, index) => {
          SL_Sub_List.addField({
            id: `custpage_column_${index}`,
            type: serverWidget.FieldType.TEXT,
            label: header,
          });
        });

        // Populate sublist with parsed data
        parsedData[1].forEach((row, rowIndex) => {
          row.forEach((value, colIndex) => {
            SL_Sub_List.setSublistValue({
              id: `custpage_column_${colIndex}`,
              line: rowIndex, // Skip header row for data
              value: value || "N/A", // Default if empty
            });
          });
        });

        // Set the record count
        SL_RecordCountLabel.defaultValue = `<b>Total Records Found: ${parsedData[1].length}</b>`; // Exclude header row
      } catch (e) {
        log.error("File Load Error", "Could not load file: " + e.message);
        SL_RecordCountLabel.defaultValue = `<b>Error loading file: ${e.message}</b>`;
      }
    } else {
      // Create the file upload field for the user to upload CSV file
      const fileUploadField = SL_Form.addField({ id: "custpage_file_upload", type: serverWidget.FieldType.FILE, label: "Upload CSV File" });
      SL_Form.addSubmitButton({ label: "Upload and Parse CSV" });
    }
    response.writePage(SL_Form);
  };

  // Function to validate the CSV content
  const validateCSV = (csvData) => {
    if (!csvData) return "No file content found.";

    // Check if CSV has at least one row and column
    const rows = csvData.split("\n").filter((line) => line.trim() !== "");
    if (rows.length < 2) return "CSV file must have at least one data row.";

    // Check if all rows have the same number of columns
    const columnsCount = rows[0].split(",").length;
    for (let i = 1; i < rows.length; i++) {
      const rowColumnsCount = rows[i].split(",").length;
      if (rowColumnsCount !== columnsCount) {
        return `Row ${i + 1} has a different number of columns.`;
      }
    }

    return null; // No validation error
  };

  // Function to parse the CSV data into an array of rows and columns
  const parseCSV = (csvData) => {
    var allTextLines = csvData.split(/\r\n|\n/);
    var headers = allTextLines[0].split(",");
    log.debug("CSV Data headers", headers);

    var lines = [];

    for (var i = 1; i < allTextLines.length; i++) {
      var data = allTextLines[i].split(",");
      if (data.length == headers.length) {
        var tarr = [];
        for (var j = 0; j < headers.length; j++) {
          tarr.push(data[j]);
        }
        lines.push(tarr);
      }
    }
    log.debug("CSV Data lines", lines);
    parsedData = [headers, lines];
    return parsedData; // Return the parsed data as an array of arrays
  };

  return {
    onRequest,
  };
});
