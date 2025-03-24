const fs = require('fs');
const path = require('path');

function getAllFilePaths(dir, filterExtensions = []) {
    if (typeof dir !== 'string') {
        throw new Error('The first argument must be a string representing the directory path.');
    }

    if(typeof filterExtensions === 'string') {
        filterExtensions = [filterExtensions];
    }
    if (!Array.isArray(filterExtensions)) {
        filterExtensions = [];
    }
    const stack = [dir];
    let results = [];
    while (stack.length > 0) {
        const currentDir = stack.pop();
        const files = fs.readdirSync(currentDir);

        files.forEach(file => {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                stack.push(filePath);
            } else {
                const ext = path.extname(file);
                if(filterExtensions.length === 0) {
                    results.push(filePath);
                } else if (filterExtensions.includes(ext)) {
                    results.push(filePath);
                }
            }
        });
    }
    return results;
}

// Example usage:
// const dirPath = '/path/to/your/directory';
// const excludeExtensions = ['.txt', '.md'];
// const filePaths = getAllFilePaths(dirPath, excludeExtensions);
// console.log(filePaths);


function readFilesContent(filePaths, separator = '') {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
        return '';
    }

    let contents = filePaths
            .filter(filePath => typeof filePath === 'string' && filePath.length > 0)
            .map(filePath => readFile(filePath));

    if(contents.length > 0) {
        contents.push('');
        return contents.join(separator);
    }
    return '';
}

// Example usage:
// const fileContents = readFilesContent(filePaths, '\n---\n');
// console.log(fileContents);


function readFile(filePath) {
    if (typeof filePath !== 'string') {
        throw new Error('The first argument must be a string representing the file path.');
    }

    return fs.readFileSync(filePath, 'utf8');
}

function replaceInFiles(filePaths, searchValue, replaceValue) {
    if (!Array.isArray(filePaths)) {
        throw new Error('The first argument must be an array of file paths.');
    }

    filePaths.forEach(filePath => {
        if (typeof filePath !== 'string') {
            throw new Error('Each file path must be a string.');
        }
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(new RegExp(searchValue, 'g'), replaceValue);
        fs.writeFileSync(filePath, content, 'utf8');
    });
}

// Example usage:
// const searchValue = 'oldString';
// const replaceValue = 'newString';
// replaceInFiles(filePaths, searchValue, replaceValue);


function saveFile(filePath, content) {
    if (typeof filePath !== 'string') {
        throw new Error('The first argument must be a string representing the file path.');
    }
    if (typeof content !== 'string') {
        throw new Error('The second argument must be a string representing the file content.');
    }

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

// Example usage:
// const newFilePath = '/path/to/your/newfile.txt';
// const newContent = 'This is the content of the new file.';
// saveFile(newFilePath, newContent);

module.exports = { 
    getAllFilePaths, 
    readFilesContent, 
    readFile, 
    replaceInFiles, 
    saveFile 
};