document.addEventListener("DOMContentLoaded", function () {
    var inputField = document.getElementById("playerFilter");
    var form = document.getElementById("fileForm");

    // Make "Enter" key trigger analyzeFile()
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            analyzeFile();
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        analyzeFile();
    });
});

function analyzeFile() {
    var fileInput = document.getElementById("file");
    var playerFilter = document.getElementById("playerFilter").value;
    var resultDiv = document.getElementById("result");

    if (!fileInput.files.length) {
        alert("Please select a file.");
        return;
    }

    var file = fileInput.files[0];
    var reader = new FileReader();

    reader.onload = function (event) {
        var fileContent = event.target.result;
        var lootDict = {};
        var lootLogLines = fileContent.split("\n");

        function preserveFormat(inputString) {
            return inputString ? inputString.replace(/[^a-zA-Z0-9@_]/g, '') : ''; // Keep underscores
        }

        lootLogLines.forEach(function (lootEvent) {
            var lootEventSplit = lootEvent.split(";");
            var lootedFrom = preserveFormat(lootEventSplit[9]);
            var itemID = preserveFormat(lootEventSplit[4]); // Keep original format
            var itemName = lootEventSplit[5]; // Readable item name

            if (lootedFrom.toLowerCase() === playerFilter.toLowerCase()) {
                var playerName = lootEventSplit[3];
                var guildName = lootEventSplit[2]; // Extract Guild Name

                // **FILTER OUT TRASH ITEMS**
                if (itemID.includes("TRASH")) return;

                if (!(playerName in lootDict)) {
                    lootDict[playerName] = { guild: guildName, items: [] };
                }

                lootDict[playerName].items.push({ itemID, itemName }); // Store full ID & readable name
            }
        });

        // Clear and display results
        resultDiv.innerHTML = "";
        Object.keys(lootDict).forEach(player => {
            var playerLootSection = document.createElement("div");
            playerLootSection.classList.add("loot-entry");

            // Player Name & Guild Header
            var playerInfo = document.createElement("p");
            playerInfo.innerHTML = `<strong>${player}</strong> <span style="color:#00adb5;">(${lootDict[player].guild})</span>`;

            playerLootSection.appendChild(playerInfo);

            var itemContainer = document.createElement("div");
            itemContainer.classList.add("item-container");

            lootDict[player].items.forEach(item => {
                var itemImg = document.createElement("img");
                itemImg.src = `https://render.albiononline.com/v1/item/${item.itemID}.png?count=1&quality=1&size=217`;
                itemImg.alt = item.itemName;
                itemImg.style.margin = "5px";

                var itemLink = document.createElement("a");
                itemLink.href = `https://east.albiondb.net/player/${player}`;   
                itemLink.target = "_blank";
                itemLink.appendChild(itemImg);

                itemContainer.appendChild(itemLink);
            });

            playerLootSection.appendChild(itemContainer);
            resultDiv.appendChild(playerLootSection);
        });

        if (Object.keys(lootDict).length === 0) {
            resultDiv.innerHTML = "<p style='color:#FF5252; font-size:18px;'>No matching loot found.</p>";
        }

        // Scroll to results
        resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Show loading indicator while processing
    resultDiv.innerHTML = "<p style='color:#00adb5; font-size:18px;'>Processing loot log...</p>";

    reader.readAsText(file);
}
