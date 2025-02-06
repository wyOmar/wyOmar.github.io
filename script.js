document.addEventListener("DOMContentLoaded", function () {
    var inputField = document.getElementById("playerFilter");
    var fileInput = document.getElementById("file");
    var form = document.getElementById("fileForm");
    var suggestionsDiv = document.createElement("div");
    suggestionsDiv.id = "suggestions";
    inputField.parentNode.appendChild(suggestionsDiv);

    var playerNames = new Set(); // Store unique usernames

    // Event listener for file upload
    fileInput.addEventListener("change", function () {
        playerNames.clear();
        suggestionsDiv.innerHTML = "";
        extractPlayerNames();
    });

    inputField.addEventListener("input", function () {
        const query = inputField.value.trim().toLowerCase();
        suggestionsDiv.innerHTML = "";
    
        if (!query) {
            suggestionsDiv.classList.remove("show");
            return;
        }
    
        const matches = Array.from(playerNames)
            .filter(name => name.toLowerCase().includes(query))
            .slice(0, 4);
    
        if (matches.length === 0) {
            suggestionsDiv.classList.remove("show");
            return;
        }
    
        matches.forEach(name => {
            const div = document.createElement("div");
            div.textContent = name;
            div.className = "suggestion-item";
            div.onclick = () => {
                inputField.value = name;
                suggestionsDiv.classList.remove("show");
                analyzeFile();
            };
            suggestionsDiv.appendChild(div);
        });
    
        suggestionsDiv.classList.add("show");
    });
    
    

    // Prevent default form submission
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        analyzeFile();
    });

    function extractPlayerNames() {
        if (!fileInput.files.length) return;
    
        var reader = new FileReader();
    
        reader.onload = function (event) {
            var fileContent = event.target.result;
            var lootLogLines = fileContent.split("\n");
    
            // **Skip the first line (headers)**
            lootLogLines.slice(1).forEach(function (lootEvent) {
                var lootEventSplit = lootEvent.split(";");
                if (lootEventSplit.length > 3) {
                    playerNames.add(lootEventSplit[3]); // Extract looted_by_name
                }
            });
        };
    
        reader.readAsText(fileInput.files[0]);
    }
    

    function analyzeFile() {
        var playerFilter = inputField.value.trim();
        var resultDiv = document.getElementById("result");
        // Hide suggestions whenever analyzeFile() is triggered
        suggestionsDiv.innerHTML = "";
        suggestionsDiv.classList.remove("show");
        
        if (!fileInput.files.length || !playerFilter) {
            alert("Please select a file and enter a username.");
            return;
        }
        
        var file = fileInput.files[0];
        var reader = new FileReader();
        
        reader.onload = function (event) {
            var fileContent = event.target.result;
            var lootDict = {};
            var lootLogLines = fileContent.split("\n");

            lootLogLines.forEach(function (lootEvent) {
                var lootEventSplit = lootEvent.split(";");
                if (lootEventSplit.length < 10) return;
                
                var lootedFrom = lootEventSplit[9];
                var itemID = lootEventSplit[4];
                var itemName = lootEventSplit[5];
                
                if (lootedFrom.toLowerCase() === playerFilter.toLowerCase()) {
                    var playerName = lootEventSplit[3];
                    var guildName = lootEventSplit[2];
                    
                    if (itemID.includes("TRASH")) return; // Filter trash items
                    
                    if (!(playerName in lootDict)) {
                        lootDict[playerName] = { guild: guildName, items: [] };
                    }
                    
                    lootDict[playerName].items.push({ itemID, itemName });
                }
            });
            
            // Display results
            resultDiv.innerHTML = "";
            Object.keys(lootDict).forEach(player => {
                var playerLootSection = document.createElement("div");
                playerLootSection.classList.add("loot-entry");
                
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
            
            resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        
        resultDiv.innerHTML = "<p style='color:#00adb5; font-size:18px;'>Processing loot log...</p>";
        reader.readAsText(file);
    }
});


