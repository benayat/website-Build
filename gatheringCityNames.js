const fs = require('fs');

let rawdata = fs.readFileSync('./city.list.json');
let cities = JSON.parse(rawdata);
let ILCities = JSON.stringify(
  cities
    .filter((x) => x.country === 'IL')
    .map((x) => {
      return { name: x.name, id: x.id };
    })
);
fs.writeFileSync('ilCityList.json', ILCities);
