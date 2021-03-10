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
}

class makeTable {}

async function go() {
  try {
    const allData = new dataManager();
    allData.init();
    console.log(allData);
  } catch (error) {
    console.error(error);
  }
}
go();
