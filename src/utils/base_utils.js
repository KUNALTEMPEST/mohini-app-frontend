import wordsToNumbers from "words-to-numbers";

export function spokenWordsToDigits(input) {
    const words = input.trim().toLowerCase().split(/\s+/);
    let digits = "";
  
    for (const word of words) {
      const num = wordsToNumbers(word);
      if (typeof num === "number" && num < 10) {
        digits += num.toString();
      }
    }
  
    return digits;
}