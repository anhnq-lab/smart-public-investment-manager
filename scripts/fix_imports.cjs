
const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, 'features');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const files = getAllFiles(featuresDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Up one level fixes (since files are now in features/subdir/)
    content = content.replace(/from '\.\.\/mockData/g, "from '../../mockData");
    content = content.replace(/from '\.\.\/types/g, "from '../../types");
    content = content.replace(/from '\.\.\/context/g, "from '../../context");

    // Layouts
    content = content.replace(/from '\.\.\/components\/Sidebar/g, "from '../../layouts/Sidebar");

    // Common Components
    content = content.replace(/from '\.\.\/components\/Header/g, "from '../../components/common/Header");
    content = content.replace(/from '\.\.\/components\/AIChatbot/g, "from '../../components/common/AIChatbot");
    content = content.replace(/from '\.\.\/components\/GlobalSearch/g, "from '../../components/common/GlobalSearch");
    content = content.replace(/from '\.\.\/components\/NotificationCenter/g, "from '../../components/common/NotificationCenter");
    content = content.replace(/from '\.\.\/components\/InteractiveMap/g, "from '../../components/common/InteractiveMap");

    // Generic Components (e.g., UI elements if any, or remaining components)
    // Be careful not to double replace if we already did common components
    // We use a lookahead or just simple replace for remaining '../components'
    content = content.replace(/from '\.\.\/components\//g, "from '../../components/");

    // Fix self-references (e.g. ProjectList referencing ProjectDetail in same folder)
    // In original code, they were in same folder './ProjectDetail'. 
    // Now they are still in same folder, so './' remains valid. 
    // BUT if they imported `from './components/ProjectDetail'`, that's wrong.
    // Most imports in App.tsx were `./components/...`
    // File-to-file imports in same directory usually are `./File`.

    // Fix specific "Contractor" imports in ProjectList/Detail if any
    // ProjectList imports nothing from components usually besides icons.

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated imports in: ${file}`);
    }
});
