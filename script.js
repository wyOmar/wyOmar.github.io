document.addEventListener("DOMContentLoaded", function () {
    var inputField = document.getElementById("playerFilter");
    var fileInput = document.getElementById("file");
    var form = document.getElementById("fileForm");
    var suggestionsDiv = document.createElement("div");
    suggestionsDiv.id = "suggestions";
    inputField.parentNode.appendChild(suggestionsDiv);

    var playerNames = new Set(); // Store unique usernames

    // --- Interactive Eyes Logic ---
    document.addEventListener("mousemove", function(e) {
        const eyes = document.querySelectorAll('.eye');
        eyes.forEach(eye => {
            const rect = eye.getBoundingClientRect();
            const pupil = eye.querySelector('.pupil');
            
            // Calculate center of the eyeball
            const eyeX = rect.left + rect.width / 2;
            const eyeY = rect.top + rect.height / 2;

            // Calculate angle from the eye to the cursor
            const angle = Math.atan2(e.clientY - eyeY, e.clientX - eyeX);

            // Calculate distance to move the pupil, constrained by the eye's radius
            const dist = Math.hypot(e.clientX - eyeX, e.clientY - eyeY);
            const maxRadius = (rect.width / 2) - (pupil.offsetWidth / 2) - 4; // 4px padding so it doesn't clip
            const distanceToMove = Math.min(dist, maxRadius);

            // Apply translation
            const moveX = Math.cos(angle) * distanceToMove;
            const moveY = Math.sin(angle) * distanceToMove;

            pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    });

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
    
            // Detect delimiter (comma or semicolon)
            var delimiter = detectDelimiter(lootLogLines[0]);
    
            // Skip the first line (headers)
            lootLogLines.slice(1).forEach(function (lootEvent) {
                if (!lootEvent.trim()) return;
    
                var lootEventSplit = lootEvent.split(delimiter);
                if (lootEventSplit.length > 9) {
                    var playerName = lootEventSplit[9].trim(); // Extract looted_by_name
                    if (playerName) {
                        playerNames.add(playerName);
                    }
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
            var guildDict = {}; // Structure: { GuildName: { PlayerName: [items] } }
            var lootLogLines = fileContent.split("\n");
    
            // Detect delimiter (comma or semicolon)
            var delimiter = detectDelimiter(lootLogLines[0]);
    
            lootLogLines.forEach(function (lootEvent) {
                if (!lootEvent.trim()) return;
    
                var lootEventSplit = lootEvent.split(delimiter);
                if (lootEventSplit.length < 10) return;
    
                var lootedFrom = lootEventSplit[9].trim();
                var itemID = lootEventSplit[4].trim();
                var itemName = lootEventSplit[5].trim();
    
                if (lootedFrom.toLowerCase() === playerFilter.toLowerCase()) {
                    var playerName = lootEventSplit[3].trim();
                    var guildName = lootEventSplit[2].trim() || "No Guild";
    
                    if (itemID.includes("TRASH")) return; // Filter trash items
    
                    // Initialize Guild grouping
                    if (!(guildName in guildDict)) {
                        guildDict[guildName] = {};
                    }
                    // Initialize Player grouping inside Guild
                    if (!(playerName in guildDict[guildName])) {
                        guildDict[guildName][playerName] = [];
                    }
    
                    guildDict[guildName][playerName].push({ itemID, itemName });
                }
            });
    
            // Display results
            resultDiv.innerHTML = "";
            
            // Sort Guilds by total items looted (Highest to Lowest)
            var sortedGuilds = Object.keys(guildDict).sort(function(a, b) {
                var totalItemsA = 0;
                for (var playerA in guildDict[a]) {
                    totalItemsA += guildDict[a][playerA].length;
                }
                
                var totalItemsB = 0;
                for (var playerB in guildDict[b]) {
                    totalItemsB += guildDict[b][playerB].length;
                }
                
                return totalItemsB - totalItemsA;
            });

            sortedGuilds.forEach(guild => {
                // Create a distinct section container for each Guild
                var guildSection = document.createElement("div");
                guildSection.classList.add("guild-section");

                var guildHeader = document.createElement("h2");
                guildHeader.classList.add("guild-header");
                guildHeader.textContent = guild;
                guildSection.appendChild(guildHeader);

                // Grid wrapper for the cards inside this specific guild
                var guildGrid = document.createElement("div");
                guildGrid.classList.add("guild-grid");
    
                // Sort players within this guild by item count (highest to lowest)
                var sortedPlayers = Object.keys(guildDict[guild]).sort(function(a, b) {
                    return guildDict[guild][b].length - guildDict[guild][a].length;
                });

                sortedPlayers.forEach(player => {
                    var playerLootSection = document.createElement("div");
                    playerLootSection.classList.add("loot-entry");
        
                    var playerInfo = document.createElement("p");
                    playerInfo.innerHTML = `<strong>${player}</strong>`;
                    playerLootSection.appendChild(playerInfo);
        
                    var itemContainer = document.createElement("div");
                    itemContainer.classList.add("item-container");
        
                    guildDict[guild][player].forEach(item => {
                        var itemImg = document.createElement("img");
                        itemImg.src = `https://render.albiononline.com/v1/item/${item.itemID}.png?count=1&quality=1&size=217`;
                        itemImg.alt = item.itemName;
        
                        var itemLink = document.createElement("a");
                        itemLink.href = `https://east.albiondb.net/player/${player}`;
                        itemLink.target = "_blank";
                        itemLink.appendChild(itemImg);
        
                        itemContainer.appendChild(itemLink);
                    });
        
                    playerLootSection.appendChild(itemContainer);
                    guildGrid.appendChild(playerLootSection);
                });

                guildSection.appendChild(guildGrid);
                resultDiv.appendChild(guildSection);
            });
    
            if (Object.keys(guildDict).length === 0) {
                resultDiv.innerHTML = "<p style='color:#FF5252; font-size:18px; text-align:center; width:100%;'>No matching loot found.</p>";
            }
    
            resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
        };
    
        resultDiv.innerHTML = "<p style='color:#00adb5; font-size:18px; text-align:center; width:100%;'>Processing loot log...</p>";
        reader.readAsText(file);
    }
    
    // Helper function to detect delimiter
    function detectDelimiter(line) {
        if (line.includes(",")) {
            return ","; 
        } else if (line.includes(";")) {
            return ";"; 
        } else {
            throw new Error("Unknown delimiter. File must be comma- or semicolon-delimited.");
        }
    }
});