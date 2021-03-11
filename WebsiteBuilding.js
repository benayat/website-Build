class dataManager {
  constructor() {
    this.weatherKey = `906063fe9f05a947b2d73946da6d0da0`;
    this.weatherURLStart = `http://api.openweathermap.org/data/2.5/weather?id=`;
    this.allUsersShort = 'https://apple-seeds.herokuapp.com/api/users/';
    this.specificUserStartURL = this.allUsersShort;
  }
  async init() {
    await this.getCityCodes();
    await this.getAllWeather();
    await this.getUserData();
  }

  initFromLocalStorage(localStorageObject) {
    this.ILCityNamesCodes = localStorageObject.ILCityNamesCodes;
    this.allUsersData = localStorageObject.allUsersData;
    this.citiesWeather = localStorageObject.citiesWeather;
  }
  async initWeather() {
    await this.getAllWeather();
  }
  async getCityCodes() {
    const rawILCityNamesCodes = await fetch('./ilCityList.json');
    this.ILCityNamesCodes = await rawILCityNamesCodes.json();
  }
  async getweather(cityCode) {
    const response = await fetch(
      this.weatherURLStart +
        cityCode +
        '&units=metric' +
        '&appid=' +
        this.weatherKey
    );
    const data = await response.json();
    const weather = data.weather[0].description;
    const temp = data.main.temp;
    return {
      weather: weather,
      temp: temp,
    };
  }
  async getAllWeather() {
    this.citiesWeather = await Promise.all(
      this.ILCityNamesCodes.map(async (element) => {
        const weather = await this.getweather(element.id);
        return { name: element.name, weather: weather };
      })
    );
  }
  async getUserData() {
    const responseAll = await fetch(this.allUsersShort);
    const data = await responseAll.json();
    const fullData = await Promise.all(
      data.map(async (user) => {
        let responseUser = await fetch(this.specificUserStartURL + user.id);
        let userData = await responseUser.json();
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          capsule: user.capsule,
          age: userData.age,
          city: userData.city,
          gender: userData.gender,
          hobby: userData.hobby,
        };
      })
    );
    this.allUsersData = fullData;
  }
  removeUser(id) {
    const userIndex = this.allUsersData.findIndex((x) => x.id === parseInt(id));
    if (userIndex === -1) throw 'remove user - user not found';
    this.allUsersData.splice(userIndex, 1);
  }
  updateDatabaseFromApi() {
    this.initWeather();
  }
}
/* 
actions needed:

*/

/* 
data reminder: data=>allUsersData=>
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          capsule: user.capsule,
          age: userData.age,
          city: userData.city,
          gender: userData.gender,
          hobby: userData.hobby,

*/
class makeTable {
  constructor(data) {
    this.data = data;
    this.table = document.querySelector('.users-table');
  }
  init() {
    this.setRowsOnDOM();
    this.setEventListeners();
  }
  removeAllData() {
    this.table.removeChild(this.table.getElementsByTagName('tbody')[0]);
  }
  // *check sorting behaviour - does it recognize the attribute parameter? did the binding worked?
  //change sorting function for alphabetical comparison vs numberical.
  setRowsOnDOM(attribute = 'id') {
    if (this.table.querySelector('tbody')) {
      this.removeAllData();
    }
    this.table.insertAdjacentHTML('beforeend', `<tbody></tbody>`);
    this.data.allUsersData.sort((user1, user2) => {
      if (user1[attribute] > user2[attribute]) {
        return 1;
      } else if (user1[attribute] < user2[attribute]) {
        return -1;
      } else {
        return 0;
      }
    });
    for (const user of this.data.allUsersData) {
      this.addTableRow(user);
    }
  }
  setFilteredRowsOnDOM(attribute, filterString) {
    this.removeAllData();
    this.table.insertAdjacentHTML('beforeend', `<tbody></tbody>`);

    const filter = (user) =>
      new RegExp(`^${filterString}`, 'i').test(user[attribute]);
    for (const user of this.data.allUsersData.filter(filter)) {
      this.addTableRow(user);
    }
  }
  addTableRow(user) {
    const innerHTML = `<tr><td>${user.id}</td><td>${user.firstName}</td><td>${user.lastName}</td><td>${user.capsule}</td><td>${user.age}</td><td>${user.city}</td><td>${user.gender}</td><td>${user.hobby}</td><td><button class = "first edit">edit</button></td><td><button class = "second delete">delete</button></td></tr> `;
    this.table
      .querySelector('tbody')
      .insertAdjacentHTML('beforeend', innerHTML);

    const currentCityWeather = this.data.citiesWeather.find(
      (x) => x.name === user.city
    );
    if (typeof currentCityWeather !== 'undefined') {
      const weatherDiv = `<div class = "weatherDiv">city:${currentCityWeather.name}\ntemperature: ${currentCityWeather.weather.temp}\nweather: ${currentCityWeather.weather.weather}</div>`;

      const cityTD = this.table
        .querySelector('tbody')
        .lastElementChild.querySelector('td:nth-child(6)');
      cityTD.insertAdjacentHTML('beforeend', weatherDiv);
    }
  }
  setEventListeners() {
    const searchBox = document.querySelector('#searchBox');

    searchBox.addEventListener('keyup', (event) => {
      const attribute = document.querySelector('#selectSearch').value;
      const filterString = event.target.value;
      this.setFilteredRowsOnDOM(attribute, filterString);
    });
    const editHandlerBind = makeTable.editHandler.bind(this);
    const sortHandlerBind = makeTable.sortHandler.bind(this);
    const deleteRowBind = makeTable.deleteRow.bind(this);
    this.table.addEventListener('click', sortHandlerBind);
    this.table.addEventListener('click', editHandlerBind);
    this.table.addEventListener('click', deleteRowBind);
  }
  static sortHandler(event) {
    if (event.target.tagName != 'TH') return;
    const attribute = toWeirdCase(event.target.innerText);
    this.setRowsOnDOM(attribute);
  }
  static editHandler(event) {
    if (event.target.innerText != 'edit' || event.target.nodeName != 'BUTTON')
      return;
    const currentRow = event.target.parentElement.parentElement;
    const currentUser = this.data.allUsersData.find(
      (x) => x.id === parseInt(currentRow.firstElementChild.innerText)
    );
    const savedInerHTML = currentRow.innerHTML;
    currentRow.innerHTML = `<tr><td>${currentUser.id}</td><td><input type="text" id="fname" value="${currentUser.firstName}"></td><td><input type="text" id="lname" value="${currentUser.lastName}"></td><td><input type="number" id="capsule" value="${currentUser.capsule}"></td><td><input type="number" id="age" value="${currentUser.age}"></td><td><input type="text" id="city" value="${currentUser.city}"></td><td><input type="text" id="gender" value="${currentUser.gender}"></td><td><input type="text" id="hobby" value="${currentUser.hobby}"></td><td><button class = "first cancel">cancel</button></td><td><button class = "second confirm">confirm</button></td></tr>`;
    const cancelButton = currentRow.querySelector('.cancel');
    const confirmButton = currentRow.querySelector('.confirm');
    //binding the previous innerHtml to revert to.
    const revertBind = makeTable.revert.bind(savedInerHTML);
    //binding this to make and update chages on.
    const updateValuesBind = makeTable.updateValues.bind(this);
    cancelButton.addEventListener('click', revertBind, { once: true });
    confirmButton.addEventListener('click', updateValuesBind, { once: true });
  }
  static revert(event) {
    if (event.target.nodeName != 'BUTTON') return;
    event.stopPropagation();
    const row = event.target.parentElement.parentElement;
    row.innerHTML = this;
  }
  static updateValues(event) {
    if (event.target.nodeName != 'BUTTON') return;
    event.stopPropagation();
    const currentRow = event.target.parentElement.parentElement;
    const currentUser = this.data.allUsersData.find(
      (x) => x.id === parseInt(currentRow.firstElementChild.innerText)
    );
    const rowChildren = event.target.parentElement.parentElement.children;
    currentUser.firstName = rowChildren.item(1).firstElementChild.value;
    currentUser.lastName = rowChildren.item(2).firstElementChild.value;
    currentUser.capsule = rowChildren.item(3).firstElementChild.value;
    currentUser.age = rowChildren.item(4).firstElementChild.value;
    currentUser.city = rowChildren.item(5).firstElementChild.value;
    currentUser.gender = rowChildren.item(6).firstElementChild.value;
    currentUser.hobby = rowChildren.item(7).firstElementChild.value;
    //need to make it happen!
    // this.data.updateDatabaseFromApi();
    this.removeAllData();
    this.setRowsOnDOM();
  }
  static deleteRow(event) {
    if (event.target.innerText != 'delete' || event.target.nodeName != 'BUTTON')
      return;
    const currentRow = event.target.parentElement.parentElement;
    //get the id:
    this.data.removeUser(currentRow.firstElementChild.innerText);
    this.data.updateDatabaseFromApi();
    this.removeAllData();
    this.setRowsOnDOM();
  }
}

async function go() {
  try {
    let localData = localStorage.getItem('all data');
    if (!localData) {
      localData = new dataManager();
      await localData.init();
      localStorage.setItem('all data', JSON.stringify(localData));
    } else {
      localData = JSON.parse(localData);
      const temp = new dataManager();
      temp.initFromLocalStorage(localData);
      localData = temp;
    }
    const usersTable = new makeTable(localData);
    usersTable.init();
  } catch (error) {
    console.error(error);
  }
}
go();

/* 
left to do: 
- set event listeners: on the table head for sorting.
* I assume that there is no need to redo event listeners for the dynamically created elements. I'll check it tommorow.
*/

/* 
at 4am wednesday: left to do : prevent unwanted behaviour from the table click events.
at 5:44am: remaining - delete function - when parsing json object back from local storage, it doesn't retrieve back the class functions too. I need to write a function to convert it back. maybe using lodash.
- also - make weather div show on hover.
*/
function toWeirdCase(str) {
  return str
    .split(/-|_| /)
    .map((word, index, array) => (array[0] == word ? word.toLowerCase() : word))
    .join('');
}
