//Aqui se importan los modulos necesarios
const cheerio = require("cheerio"); //Herramientas para web scraping
const fs = require("fs");
const request = require("request"); //Para peticiones http

var options = {
  headers: { "user-agent": "node.js" }
};
//Commets test
//Aqui se descarga la pagina de la lista de productos de falabella
request(
  "https://www.falabella.com/falabella-cl/category/cat70008/Bicicletas-Mountain-Bike",
  options,
  (err, res, body) => {
    console.log("Error: " + err + " | Res: " + res.statusCode);
    //Si el request es completado con exito se inicia el scrapping
    if (!err && res.statusCode == 200) {
      console.log("Request successful");
      //Se carga la pagina en cheerio
      // fs.writeFileSync("prodListPage.html", body);
      let $ = cheerio.load(body);
      let i = 0;
      //Se guarda las seccion con el tag de script de index 7 la cual contiene la variable que posee la lista de productos
      var text = $("script")[7].children[0].data;
      //Se limpia el string para luego recortar la variable que contiene la lista de productos y traspasarla a JSON
      var findAndClean = findTextAndReturnRemainder(
        text,
        "var fbra_browseProductListConfig ="
      );
      var result = JSON.parse(findAndClean);
      // fs.writeFileSync("prodList.json", JSON.stringify(result));

      //Una vez que se tenga el JSON de la variable que contiene la informacion de lista de producots , esta se recorre y se busca dentro de sus objetos el titulo y precion original
      result.state.searchItemList.resultList.forEach(product => {
        let title = product.title;
        let price = product.prices[0].originalPrice;
        console.log("Product name: " + title + " | Price: " + price);
      });
    }
  }
);

function findTextAndReturnRemainder(target, variable) {
  var chopFront = target.substring(
    target.search(variable) + variable.length,
    target.length
  );
  var result = chopFront.substring(0, chopFront.search(";"));
  return result;
}

console.log("Scrap finished");
