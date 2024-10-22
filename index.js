import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app=express();
app.use(bodyParser.urlencoded({extended:true}))
const port=3000;
app.use(express.static("public"));


function getWeather(weatherUpdate, days) {
    const currentDate = new Date();
    
    // Get the current day, month, and year
    let day = currentDate.getDate();
    let month = currentDate.getMonth() + 1; // Month is zero-based, so add 1
    let year = currentDate.getFullYear();
    
    // Increase the current date by the specified number of days
    day += days - 1;

    // Check if the day exceeds the month end, adjust month and day accordingly
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
        day -= daysInMonth;
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }

    // Format the date in YYYY-MM-DD format
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0');
    const today = `${year}-${formattedMonth}-${formattedDay}`;
    
    console.log(today);

    // Filter weather data for the specified date
    const weatherForDay = weatherUpdate.list.filter(item => item.dt_txt.includes(today));

    return weatherForDay;
}


app.get("/",(req,res)=>{
    res.render("index.ejs",{
        errorMessage:null
    });
})
app.post("/submit",async(req,res)=>{
    const daysi=req.body.days;
    const cityi=req.body.city;
    if(daysi<=0 || daysi>5 || cityi===""){
        res.render("index.ejs",{
            errorMessage:"Entered Details Is Incorrect."
        });
    }
    else{
        let lati;
        let loni;
        try{
            const resdata=await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${cityi}&appid=e07464c3446cc0a791203a213c1ba1c9`);
            lati=resdata.data[0].lat;
            loni=resdata.data[0].lon;
            const weatherUpdate=await axios.get(`http://api.openweathermap.org/data/2.5/forecast?lat=${lati}&lon=${loni}&appid=e07464c3446cc0a791203a213c1ba1c9`);
            // console.log(weatherUpdate.data);
            const weatherOnDay=getWeather(weatherUpdate.data,daysi);
            let temperature,humidity,weatherDescription,windSpeed,dateTime,pop;
            let arr=[];
            weatherOnDay.forEach(data => {
                const temp=data.main.temp;
                const hum=data.main.humidity;
                const wd=data.weather[0].description;
                const wsp=data.wind.speed;
                const rain=data.pop;
                const time=data.dt_txt;
                const weatherObj={
                    temperature : temp, // Temperature in Kelvin
                    humidity : hum, // Humidity percentage
                    weatherDescription : wd, // Description of weather condition
                    windSpeed : wsp, // Wind speed in meters per second
                    pop : rain, // Probability of Precipitation as a percentage
                    dateTime : time, // Date and time in YYYY-MM-DD HH:MM:SS format
                };
                arr.push(weatherObj);
                
            });
            res.render("result.ejs",{
                city:cityi,
                days:daysi,
                lat:lati,
                lon:loni,
                weatherData:arr,
            });
        }catch(error){
            console.error("Error:", error);
            const errorMessage="Unable to fetch weather data. Please try again."
            res.render("index.ejs",{
                errorMessage:errorMessage
            });
        }  
    }
})
app.post("/home",(req,res)=>{
    res.render("index.ejs",{
        errorMessage:null
    });
})
app.listen(port,()=>{
    console.log(`Server listed on port number ${port}`);
})