document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("fileForm").addEventListener("submit", function (event) {
        event.preventDefault();
        analyzeGuildFile();
    });

    document.getElementById("guildSelect").addEventListener("change", function () {
        setTimeout(analyzeGuildFile, 50); // Ensures the new selection is registered before execution
    });
});

function extractGuilds() {
    const fileInput = document.getElementById("file");
    const guildSelect = document.getElementById("guildSelect");

    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const fileContent = event.target.result;
        const guilds = new Set();
        const lootLogLines = fileContent.split("\n");

        // Detect delimiter (comma or semicolon)
        const delimiter = detectDelimiter(lootLogLines[0]);

        lootLogLines.forEach((line, index) => {
            const parts = line.split(delimiter);
            if (parts.length >= 9) {
                if (index === 0) return; // Skip CSV headers

                const lootedByGuild = parts[2].trim();
                const lootedFromGuild = parts[8].trim();

                if (lootedByGuild && lootedByGuild !== "looted_by_guild") guilds.add(lootedByGuild);
                if (lootedFromGuild && lootedFromGuild !== "looted_from_guild") guilds.add(lootedFromGuild);
            }
        });

        // Clear dropdown and populate with guilds
        guildSelect.innerHTML = "";
        guilds.forEach((guild, index) => {
            const option = document.createElement("option");
            option.value = guild.toLowerCase();
            option.textContent = guild;
            guildSelect.appendChild(option);

            // **Automatically select the first guild**
            if (index === 0) {
                guildSelect.value = guild.toLowerCase();
            }
        });

        guildSelect.disabled = false;

        // **Immediately trigger analysis on the first guild**
        analyzeGuildFile();
    };

    reader.readAsText(file);
}

function analyzeGuildFile() {
    const fileInput = document.getElementById("file");
    const guildSelect = document.getElementById("guildSelect");

    if (!fileInput.files.length || !guildSelect.value) return;

    const guildFilter = guildSelect.value.toLowerCase();
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const fileContent = event.target.result;
            const lootEvents = processLootData(fileContent, guildFilter);
            displayResult(lootEvents);
        } catch (error) {
            console.error("Error analyzing file:", error);
        }
    };

    reader.readAsText(file);
}

function processLootData(fileContent, guildFilter) {
    const lootEvents = [];
    const lootLogLines = fileContent.split("\n");

    // Detect delimiter (comma or semicolon)
    const delimiter = detectDelimiter(lootLogLines[0]);

    function strip(inputString) {
        return inputString ? inputString.toLowerCase().replace(/\s/g, '') : '';
    }

    for (const lootEvent of lootLogLines) {
        const lootEventSplit = lootEvent.split(delimiter);
        if (lootEventSplit.length < 10) continue; // Ensures valid format

        const lootedByGuild = strip(lootEventSplit[2]);
        const lootedFromGuild = strip(lootEventSplit[8]);

        if (lootedByGuild === strip(guildFilter) && lootedFromGuild === strip(guildFilter)) {
            const lootedBy = lootEventSplit[3];
            const itemID = lootEventSplit[4];
            const itemName = lootEventSplit[5];
            const lootedFrom = lootEventSplit[9];

            // **Filter out POTIONS & MEALS**
            if (itemID.includes("_POTION_") || itemID.includes("_MEAL_")) continue;

            let matchResult = itemID.match(/T(\d+).*?@(\d+)?/);

            if (matchResult) {
                let tier = parseInt(matchResult[1], 10);
                let enchant = matchResult[2] ? parseInt(matchResult[2], 10) : 0;

                if (tier + enchant >= 10) {
                    lootEvents.push({ itemID, itemName, lootedFrom, lootedBy });
                }
            }
        }
    }

    return lootEvents;
}

function displayResult(lootEvents) {
    let resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";

    if (lootEvents.length === 0) {
        resultDiv.innerHTML = "<p style='color:#FF5252; font-size:18px;'>No matching loot found.</p>";
        return;
    }

    let lootContainer = document.createElement("div");
    lootContainer.classList.add("loot-container");

    lootEvents.forEach(event => {
        let lootCard = document.createElement("div");
        lootCard.classList.add("loot-card");

        lootCard.innerHTML = `
            <p class="loot-info">${event.lootedFrom} <span class="arrow">→</span> ${event.lootedBy}</p>
            <img src="https://render.albiononline.com/v1/item/${event.itemID}.png?count=1&quality=1&size=217" 
                 alt="${event.itemName}" class="loot-img">
        `;

        lootContainer.appendChild(lootCard);
    });

    resultDiv.appendChild(lootContainer);
}

// Helper function to detect delimiter
function detectDelimiter(line) {
    if (line.includes(",")) {
        return ","; // Comma-delimited
    } else if (line.includes(";")) {
        return ";"; // Semicolon-delimited
    } else {
        throw new Error("Unknown delimiter. File must be comma- or semicolon-delimited.");
    }
}
