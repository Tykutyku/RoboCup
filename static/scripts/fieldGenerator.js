document.addEventListener('DOMContentLoaded', function() {
    const fieldSizeSelector = document.getElementById('fieldSizeSelector');
    const fieldContainer = document.getElementById('fieldContainer');

    fieldSizeSelector.addEventListener('change', generateField);

    function generateField() {
        const fieldSize = fieldSizeSelector.value.split('x');
        const width = fieldSize[0];
        const height = fieldSize[1];

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("id", "soccerField");
        svg.setAttribute("class", "fieldClass");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        fieldContainer.innerHTML = ''; // Clear previous field
        fieldContainer.appendChild(svg);

        svg.innerHTML = `
            <rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="#136A16" stroke="#FFF" stroke-width="2"/>
            <line x1="${width / 2}" y1="1" x2="${width / 2}" y2="${height - 1}" stroke="#FFF" stroke-width="2"/>
            <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 10}" fill="none" stroke="#FFF" stroke-width="2"/>
            <rect x="1" y="${height / 3}" width="${width / 10}" height="${height / 3}" fill="none" stroke="#FFF" stroke-width="2"/>
            <rect x="${width - width / 10 - 1}" y="${height / 3}" width="${width / 10}" height="${height / 3}" fill="none" stroke="#FFF" stroke-width="2"/>
            <rect x="1" y="${height / 2 - height / 8}" width="${width / 30}" height="${height / 4}" fill="none" stroke="#FFF" stroke-width="2"/>
            <rect x="${width - width / 30 - 1}" y="${height / 2 - height / 8}" width="${width / 30}" height="${height / 4}" fill="none" stroke="#FFF" stroke-width="2"/>
            <circle cx="${width / 2}" cy="${height / 2}" r="1.5" fill="#FFF" />
            <g id="robotPositions"></g>
        `;
    }

    generateField();
});
