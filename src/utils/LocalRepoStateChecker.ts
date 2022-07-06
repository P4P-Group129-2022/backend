// /**
//  * Checks if the state of the local repo is in the desired state.
//  * @author Dave Shin
//  */
// const info = (args: any) =>
//     console.log(
//         chalk.blue(`[${new Date().toLocaleString()}] [INFO]`),
//         typeof args === "string" ? chalk.blueBright(args) : args
//     );
//
// const fs = require('fs');
// const stringSimilarity = require('string-similarity');
//
// let exercise = fs.readFileSync('path/to/file/exercise.js');
// let solution = fs.readFileSync('path/to/file/solution.js');
//
// var similarity = stringSimilarity.compareTwoStrings(exercise, solution);
// console.log(similarity); //Returns a fraction between 0 and 1
//
// export default {info, warning, error};
