function analyzeFile() {
    // Get values from the form
    var fileInput = document.getElementById("file");
    var playerFilter = document.getElementById("playerFilter").value;

    // Check if a file is selected
    if (fileInput.files.length > 0) {
        var file = fileInput.files[0];

        // Read the contents of the file
        var reader = new FileReader();
        reader.onload = function (event) {
            var fileContent = event.target.result;

            var lootDict = {};

            var lootLogLines = fileContent.split("\n");

            function strip(inputString) {
                return inputString ? inputString.replace(/[^a-zA-Z0-9]/g, '') : '';
            }

            lootLogLines.forEach(function (lootEvent) {
                var lootEventSplit = lootEvent.split(";");
                var lootedFrom = strip(lootEventSplit[9]);

                if (lootedFrom === playerFilter) {
                    var playerName = lootEventSplit[3];
                    var itemName = lootEventSplit[4];

                    if (!(playerName in lootDict)) {
                        lootDict[playerName] = [];
                    }

                    lootDict[playerName].push(itemName);
                }
            });

            // Display the result
            var result = "";

            for (var player in lootDict) {
                if (lootDict.hasOwnProperty(player)) {
                    result += "<strong>" + player + ":</strong> ";
                    lootDict[player].forEach(function (itemName) {
                        // Wrap each image in an anchor tag with the specified link
                        result += '<a href="https://east.albiondb.net/player/' + player + '" target="_blank">'
                        result += '<img src="https://render.albiononline.com/v1/item/' + itemName + '.png?count=1&quality=1&size=100" alt="' + itemName + '">';
                        result += '</a>';
                    });
                    result += "<br><br>"; // Add an extra line break after each player's loot information
                }
            }

            document.getElementById("result").innerHTML = result;
        };

        // Read the file as text
        reader.readAsText(file);
    } else {
        // No file selected
        alert("Please select a file.");
    }
}
