/* 
documentation: I'll do my best here to explain all the functionality of my work.
*/
//one time function - I used a regex and array methods to match the attribute format to that of the database - it eliminstes spaces, and lowercasing first words.
function toWeirdCase(str) {
  return str
    .split(/-|_| /)
    .map((word, index, array) => (array[0] == word ? word.toLowerCase() : word))
    .join('');
}

class dataManager {
  //I only entered static values here. async\api calls happen in the init.
  constructor() {
    this.weatherKey = `906063fe9f05a947b2d73946da6d0da0`;
    this.weatherURLStart = `http://api.openweathermap.org/data/2.5/weather?id=`;
    this.allUsersShort = 'https://apple-seeds.herokuapp.com/api/users/';
    this.specificUserStartURL = this.allUsersShort;
  }
  //call all the async function and fill our database: getCityCodes to coordinate between the city code\names api and the weather api.
  //getAllWeather: get and massage all the data from the weather api.
  //getUserData: getting all the data from the users\classmates api.
  async init() {
    await this.getCityCodes();
    await this.getAllWeather();
    await this.getUserData();
  }
  /* 
  when I tries to store a class instance on the localStorage, it apparently didn't store the functions as well. so I had to re-initialize a new object with the datasets from the old instance.
  */
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
  //getting the weather data from api. I noticed it was in kalvin units, and there was a string to specify metric units - "&units=metric"
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
  /* 
  getting the main data. I was stuck here at first - because map doesn't work normaly with async and await, so I just wrapped it with Promise.all(), and it did all the calculations simultaneously and returned the desired values instead of promises.
  - there was a descrepancy between the city naming in the weather api and the users api, so I hard coded the changes, so the hovering would work.
  */
  async getUserData() {
    const responseAll = await fetch(this.allUsersShort);
    const data = await responseAll.json();
    const fullData = await Promise.all(
      data.map(async (user) => {
        let responseUser = await fetch(this.specificUserStartURL + user.id);
        let userData = await responseUser.json();
        switch (userData.city) {
          case 'Tirat Ha Carmel':
            userData.city = 'Tirat Karmel';
            break;
          case 'Rehovot':
            userData.city = 'Reẖovot';
            break;
          case 'Beer Sheva':
            userData.city = 'Beersheba';
            break;
          case 'Umm El Fahem':
            userData.city = 'Umm el Faḥm';
            break;
          default:
            break;
        }
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
  //remove a user - using the splice method.
  removeUser(id) {
    const userIndex = this.allUsersData.findIndex((x) => x.id === parseInt(id));
    if (userIndex === -1) throw 'remove user - user not found';
    this.allUsersData.splice(userIndex, 1);
  }
  //every time a user changes somthing in the table, I want to update the weather data.
  //* unlike the users, the weather data is dynamic and ever-changing, so updating it is necessary. for readability purposes I created another function just for that.(even though they do the same action).
  updateDatabaseFromApi() {
    this.initWeather();
  }
}
/* 
actions needed:
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
//in the constructor - I added the simple data.
class makeTable {
  constructor(data) {
    this.data = data;
    this.table = document.querySelector('.users-table');
  }
  //I used init for the more complicated data.
  init() {
    this.setRowsOnDOM();
    this.setEventListeners();
  }
  //removing the table body, to update and re-insert the values.
  removeAllData() {
    this.table.removeChild(this.table.getElementsByTagName('tbody')[0]);
  }
  //I had to write a sorting function which can sort both numeric and string values.
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
  //implementation of the search action. filtering the table according to a specific attribure and string.
  setFilteredRowsOnDOM(attribute, filterString) {
    this.removeAllData();
    this.table.insertAdjacentHTML('beforeend', `<tbody></tbody>`);
    const filter = (user) =>
      new RegExp(`^${filterString}`, 'i').test(user[attribute]);
    for (const user of this.data.allUsersData.filter(filter)) {
      this.addTableRow(user);
    }
  }
  // adding a row, using HTML. plus, I added a silent div for weather - and in the css I activated it on hover.
  //I found the specific TD tag I wanted with the nth-child(n) selector.
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
  //setting the event listeners.
  //I wanted to make the event listeners dynamic, because the buttons are always re-created, so I attached the event listener to the table itself(when possible), and used event capturing to propagate it down to the buttons.
  //I used bind in order to use this(or another parameter as this) in the static event listeners.
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
  //the handler only work when the target is not a th.
  static sortHandler(event) {
    if (event.target.tagName != 'TH') return;
    const attribute = toWeirdCase(event.target.innerText);
    this.setRowsOnDOM(attribute);
  }
  //this time, I made sure that only the correct button runs the handler code.
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
  //revert function - chainging back to what it was.
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

/* 
here was one of my biggest challenges. I wanted to use the local storage, since there are plenty of api calls, and it could take time, and waste expensive calls we can use(for example, in the weather api I only have 60 calls per minute!). but this gave me a worse challenge: local storage doesn't support class instances. so I had to create a new function to store and rehydrate the instance again. 
*/
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
