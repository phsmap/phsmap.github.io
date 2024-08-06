class CSVReader {
	// NOT SAFE for quote format!
	// NOT SAFE for multiline cells!
	// NOT SAFE for files with col number mismatches!
	static readCSV_headerontop(input_text, identifying_key = null) {
		input_text = input_text.trim();
		var lines = input_text.split("\n");
		var header_cols = lines[0].split(",");
		var rv = [];
		for (let i = 1; i < lines.length; i += 1) {
			var row = lines[i];
			var cols = row.split(",");
			var new_entry = {};
			for (let j = 0; j < cols.length; j += 1) {
				new_entry[ header_cols[j] ] = cols[j];
			}
			rv.push(structuredClone(new_entry));
		}
		if (identifying_key) {
			var rv2 = {};
			for (let i = 0; i < rv.length; i += 1) {
				rv2[rv[i][identifying_key]] = structuredClone(rv[i]);
			}
			return rv2;
		}
		return rv;
	}
}