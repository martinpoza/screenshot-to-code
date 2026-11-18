const projectName ="Screenshot to Code";
const partNumber = 1;
console.log("Hello, bittch, from " + projectName + "!");
console.log(`we are in part ${partNumber} of the project`);

function describeStep(stepNumber, task){
    return `Step ${stepNumber}: ${task}`;

}

const steps =["Look at the screenshot", "Write the code", "Check the code"];

steps.forEach((task,index) => {
    console.log(describeStep(index+1, task));
});