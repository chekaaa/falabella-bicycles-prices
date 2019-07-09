//Aqui se importan los modulos necesarios
const cheerio = require("cheerio"); //Herramientas para web scraping; requiere llama al paquete const constante
const fs = require("fs"); //fs permite la lectura y escritura de archivos
const request = require("request-promise"); //Para peticiones http 
const express = require("express");
const app = express();

var options = { //options cuando se hacen requeste a veces piden variables extras
  headers: { "user-agent": "node.js" } //dependiendo de la pagina puede pedir headers distintos
};
//Commets test
//Aqui se descarga la pagina de la lista de productos de falabella
GetBikesDataFromPage(true);

function GetBikesDataFromPage(clear,page = 1){
  request(
    "https://simple.ripley.cl/deporte-y-aventura/bicicletas/bicicletas-urbanas",
    options,
    (err, res, body) => {
      console.log("Error: " + err + " | Res: " + res.statusCode); //esto es para mostrar el error en consola
      //Si el request es completado con exito se inicia el scrapping
      if (!err && res.statusCode == 200) {
      
    
        console.log("Request successful");
        //Se carga la pagina en cheerio
        // fs.writeFileSync("prodListPage.html", body);
        let $ = cheerio.load(body);
        fs.writeFileSync("ripleyPage.html", body); //en este paso se guarda en json
       
      }
        
      //StartServer();
    }
  ); 
}



function findTextAndReturnRemainder(target, variable) {
  var chopFront = target.substring( //corta la parte de adelante, lo que etsa dentro del script 
    target.search(variable) + variable.length,
    target.length
  );
  var result = chopFront.substring(0, chopFront.search(";")); //substring recorta desde un index hasta otro
  return result;
}


console.log("Scrap finished");

function StartServer(){
  app.use(express.static("public"));
  app.set("view engine", "ejs");
  
  let products = [];

  fs.readdirSync("./").forEach(file => {
    // console.log(file);
    if(file.includes("prodList"))
    {
      var bikesData = fs.readFileSync(file);
      bikesData = JSON.parse(bikesData);
      bikesData.state.searchItemList.resultList.forEach(product => {
        let _title = product.title;
        let _price = product.prices[0].originalPrice;
        products.push({title: _title,price:_price})
    //        console.log("Product name: " + title + " | Price: " + price);
      });
    }
  });

  

  app.get("/", function (req, res){
    res.render("index",{productList : products} );
  });
  
  app.listen(3000, function(){
    console.log("escuchando puerto 3000");
  });
}

