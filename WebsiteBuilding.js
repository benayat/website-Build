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
    const userIndex = this.allUsersData.findIndex((x) => x.id === id);
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
  removeAllData() {
    this.table.removeChild(this.table.getElementsByTagName('tbody')[0]);
  }
  // *check sorting behaviour - does it recognize the attribute parameter? did the binding worked?

  setRowsOnDOM(attribute = id) {
    this.table.insertAdjacentHTML('beforeend', `<tbody></tbody>`);
    const sorter = (user1, user2) => user1[attribute] - user2[attribute];
    for (user of this.data.allUsersData.sort(sorter)) {
      this.addTableRow(user);
    }
  }
  setFilteredRowsOnDOM(attribute, filterString) {
    removeAllData();
    const filter = (user) =>
      user[attribute].match(new RegExp(`^${filterString}`));
    for (user of this.data.allUsersData.filter(filter)) {
      this.addTableRow(user);
    }
  }
  addTableRow(user) {
    const innerHTML = `<tr><td>${user.id}</td><td>${user.firstName}</td><td>${user.lastName}</td><td>${user.capsule}</td><td>${user.age}</td><td>${user.city}</td><td>${user.gender}</td><td>${user.hobby}</td></tr> <button class = "first edit">edit</button><button class = "second delete">delete</button>`;
    this.table.insertAdjacentHTML('beforeend', innerHTML);
  }
  setEventListeners() {
    const searchBox = document.querySelector('#searchBox');

    searchBox.addEventListener('keydown', (event) => {
      const attribute = document.querySelector('#selectSearch');
      const filterString = event.target.innerText;
      this.setFilteredRowsOnDOM(attribute, filterString);
    });
    const editHandlerBind = editHandler.bind(this);
    const sortHandlerBind = sortHandler.bind(this);
    const deleteRowBind = deleteRow.bind(this);
    this.table.addEventListener('click', sortHandlerBind);
    this.table.addEventListener('click', editHandlerBind);
    this.table.addEventListener('click', deleteRowBind);
  }
  static sortHandler(event) {
    if (event.target.tagName != 'TH') return;
    const attribute = event.target.innerText;
    this.setRowsOnDom(attribute);
  }
  static editHandler(event) {
    if (event.target.innerText != 'edit') return;
    const currentRow = event.target.parentElement;
    const currentUser = this.data.allUsersData.find(
      (x) => x.id === parseInt(currentRow.firstChildElement.innerText)
    );
    savedInerHTML = currentRow.innerHTML;
    currentRow.innerHTML = `<tr><td>${currentUser.id}</td><td><input type="text" id="fname" value="${currentUser.firstName}"></td><td><input type="text" id="lname" value="${currentUser.lastName}"></td><td>$<input type="text" id="capsule" value="${currentUser.capsule}"></td><td><input type="text" id="age" value="${currentUser.age}"></td><td><input type="text" id="city" value="${currentUser.city}"></td><td><input type="text" id="gender" value="${currentUser.gender}"></td><td><input type="text" id="hobby" value="${currentUser.hobby}"></td></tr><button class = "first cancel">cancel</button><button class = "second confirm">confirm</button>`;
    const cancelButton = currentRow.querySelector('.cancel');
    const confirmButton = currentRow.querySelector('.confirm');
    //binding the previous innerHtml to revert to.
    const revertBind = revert.bind(savedInerHTML);
    //binding this to make and update chages on.
    const updateValuesBind = updateValues.bind(this);
    cancelButton.addEventListener('click', revertBind, (once = true));
    confirmButton.addEventListener('click', updateValuesBind, (once = true));
  }
  static revert(event) {
    const row = event.target.parentElement;
    row.innerHTML = this;
  }
  static updateValues(event) {
    const currentUser = this.data.allUsersData.find(
      (x) => x.id === parseInt(currentRow.firstChildElement.innerText)
    );
    const rowChildren = event.target.parentElement.children;
    currentUser.firstName = rowChildren.item(1).firstChildElement.value;
    currentUser.lastName = rowChildren.item(2).firstChildElement.value;
    currentUser.capsule = rowChildren.item(3).firstChildElement.value;
    currentUser.age = rowChildren.item(4).firstChildElement.value;
    currentUser.city = rowChildren.item(5).firstChildElement.value;
    currentUser.gender = rowChildren.item(6).firstChildElement.value;
    currentUser.hobby = rowChildren.item(7).firstChildElement.value;
    //need to make it happen!
    // this.data.updateDatabaseFromApi();
    this.removeAllData();
    this.setRowsOnDOM();
    this.setEventListeners();
  }
  static deleteRow(event) {
    if (event.target.innerText != 'delete') return;
    const currentRow = event.target.parentElement;
    //get the id:
    this.data.removeUser(currentRow.firstChildElement.innerText);
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
      localStorage.setItem('all data', localData);
    } else {
      localData = JSON.parse(localData);
    }
  } catch (error) {
    console.error(error);
  }
}
go();

/* 
left to do: 
- activate search and near select.
- set event listeners: on the table head for sorting.
- more event listeners: on the table rows for editing.
- disabling all event listeners from id tds because it can't change.
- implement a removeUser to the database manager!
* I assume that there is no need to redo event listeners for the dynamically created elements. I'll check it tommorow.
*/
