/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/file", "N/log", "N/record", "N/search", "N/runtime"], (serverWidget, file, log, record, search, runtime) => {
  const onRequest = (scriptContext) => {
    const { request, response } = scriptContext;
    const SL_Form = serverWidget.createForm({ title: "CSV File Upload and Parse" });
    // Create the file upload field for the user to upload CSV file
    const fileUploadField = SL_Form.addField({ id: "custpage_file_upload", type: serverWidget.FieldType.FILE, label: "Upload CSV File" });
    // Create the sublist to display parsed CSV data
    const SL_Sub_List = SL_Form.addSublist({ id: "custpage_parsed_csv_sublist", type: serverWidget.SublistType.LIST, label: "Parsed CSV Data" });

    // Define sublist columns based on expected CSV file structure
    const csvColumns = [
      {
        id: "custpage_column1",
        label: "Column 1",
        type: serverWidget.FieldType.TEXT,
      },
      {
        id: "custpage_column2",
        label: "Column 2",
        type: serverWidget.FieldType.TEXT,
      },
      {
        id: "custpage_column3",
        label: "Column 3",
        type: serverWidget.FieldType.TEXT,
      },
    ];

    // Add columns to sublist
    csvColumns.forEach((col) => {
      SL_Sub_List.addField({
        id: col.id,
        type: col.type,
        label: col.label,
      });
    });

    // Handle the form submission (POST)
    if (request.method === "POST") {
      // Get the uploaded file
      const uploadedFileId = request.files.custpage_file_upload;
      const uploadedFile = file.load({ id: uploadedFileId });
      const csvData = uploadedFile.getContents();

      // Parse the CSV data
      const parsedData = parseCSV(csvData);

      // Populate the sublist with parsed data
      parsedData.forEach((row, index) => {
        csvColumns.forEach((col, colIndex) => {
          SL_Sub_List.setSublistValue({
            id: col.id,
            line: index,
            value: row[colIndex] || "N/A", // Fallback value
          });
        });
      });
    }

    // Add a submit button
    SL_Form.addSubmitButton({ label: "Upload and Parse CSV" });

    // Display the form
    response.writePage(SL_Form);
  };

  // Function to parse the CSV data
  const parseCSV = (csvData) => {
    const lines = csvData.split("\n"); // Split by line breaks
    const parsedData = lines.map((line) => {
      return line.split(","); // Split by commas (columns)
    });

    return parsedData; // Return the parsed data as an array of arrays
  };

  return {
    onRequest,
  };
});
