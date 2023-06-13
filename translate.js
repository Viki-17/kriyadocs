const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

//reading the input text file
fs.readFile("t8.shakespeare.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the text file:", err);
    return;
  }
  //reading the find words list
  fs.readFile("find_words.txt", "utf8", (err, findWordsData) => {
    if (err) {
      console.error("Error reading the find words list:", err);
      return;
    }

    //array to hold french dictionary
    const frenchDictionary = [];

    fs.createReadStream("french_dictionary.csv")
      .pipe(csv())
      .on("data", (row) => {
        frenchDictionary.push(row);
      })
      .on("end", () => {
        //to calculate the time taken for the process
        const startTime = new Date();

        const processedData = replace(data, findWordsData, frenchDictionary);
        const endTime = new Date();
        const processingTime = endTime - startTime;

        //saving the output as text file
        fs.writeFile("output.txt", processedData.data, "utf8", (err) => {
          if (err) {
            console.error("Error in output file:", err);
            return;
          }
          //generating the report file
          generateReport(processedData.replacedWords, processingTime);
        });
      });
  });
});

//to replace words in text file
function replace(data, findWords, dictionary) {
  const words = findWords.split("\n").map((word) => word.trim());

  //   console.log(words);
  const replacedWords = new Map();

  words.forEach((word) => {
    //to find corresponding replacement
    const replacement = dictionary.find(
      (entry) => entry.English.toLowerCase() === word.toLowerCase()
    );

    if (replacement) {
      //regular expression for matching word
      const regex = new RegExp(`\\b${word}\\b`, "g");
      const matches = data.match(regex);

      if (matches) {
        matches.forEach((match) => {
          const replacedWord =
            match === word
              ? replacement.French
              : capitalize(replacement.French, match);
          data = data.replace(match, replacedWord);

          if (replacedWords.has(word)) {
            replacedWords.set(word, replacedWords.get(word) + 1);
          } else {
            replacedWords.set(word, 1);
          }
        });
      }
    }
  });
  return { data, replacedWords };
}

//special case to replace captial word
function capitalize(word, reference) {
  const capitalized = [];

  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const refChar = reference[i];

    if (refChar === refChar.toUpperCase()) {
      capitalized.push(char.toUpperCase());
    } else {
      capitalized.push(char.toLowerCase());
    }
  }

  return capitalized.join("");
}

//to generate the report file
function generateReport(replacedWords, processingTime) {
  const reportHeader = [
    { id: "Word", title: "Word" },
    { id: "ReplacedCount", title: "Replaced Count" },
  ];

  const reportData = Array.from(replacedWords, ([word, replacedCount]) => ({
    Word: word,
    ReplacedCount: replacedCount,
  }));

  const csvWriter = createCsvWriter({
    path: "report.csv",
    header: reportHeader,
  });

  csvWriter
    .writeRecords(reportData)
    .then(() => {
      console.log("Processing complete. Output written to output.txt");
      console.log("Report generated. Report written to report.csv");
    })
    .catch((err) => {
      console.error("Error writing the report data:", err);
    });
}
