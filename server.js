//Aqui se importan los modulos necesarios
const cheerio = require("cheerio"); //Herramientas para web scraping; requiere llama al paquete const constante
const fs = require("fs"); //fs permite la lectura y escritura de archivos
const request = require("request-promise"); //Para peticiones http 
const express = require("express");
const app = express();

const falabellaLink = "https://www.falabella.com/falabella-cl/category/cat70008/Bicicletas-Mountain-Bike?sortBy=8&page=";
const ripleyLink = "https://simple.ripley.cl/deporte-y-aventura/bicicletas/bicicletas-urbanas?page=";

var options = { //options cuando se hacen requeste a veces piden variables extras
  headers: {
    "user-agent": "node.js"
  } //dependiendo de la pagina puede pedir headers distintos
};

let retailNames = {
  RIPLEY: "ripley",
  FALABELLA: "falabella"
}
//Commets test
//Aqui se descarga la pagina de la lista de productos de falabella
GetBikesDataFromPage(retailNames.FALABELLA, true);

function GetBikesDataFromPage(retail, clear, page = 1) {
  let link = "";
  switch (retail) {
    case retailNames.FALABELLA:
      link = falabellaLink;
      break;
    case retailNames.RIPLEY:
      link = ripleyLink;
      break;

    default:
      break;
  }
  request(
    link + page,
    options,
    (err, res, body) => {
      console.log("Error: " + err + " | Res: " + res.statusCode); //esto es para mostrar el error en consola
      //Si el request es completado con exito se inicia el scrapping
      if (!err && res.statusCode == 200) {
        if (clear) {
          fs.readdirSync("./").forEach(file => {
            // console.log(file);
            if (file.includes("prodList")) {
              fs.unlinkSync(file);
            }
          });
        }

        console.log("Request successful");
        //Se carga la pagina en cheerio
        // fs.writeFileSync("prodListPage.html", body);
        let $ = cheerio.load(body);
        //se cambia la variable a buscar dependiendo de la tienda
        let varName = "";
        switch (retail) {
          case retailNames.FALABELLA:
            varName = "var fbra_browseProductListConfig =";
            break;
          case retailNames.RIPLEY:
            varName = "window.__PRELOADED_STATE__ =";
          default:
            break;
        }
        //Se limpia el string para luego recortar la variable que contiene la lista de productos y traspasarla a JSON
        var findAndClean = findTextAndReturnRemainder(
          body,
          varName
        );
        if(retail === retailNames.FALABELLA)
        {
        //   console.debug(findAndClean);
           fs.writeFileSync("test4.html",body);
        // console.log(findAndClean);
        }
        
        var result = JSON.parse(findAndClean);
        var totalPages = 0;
        switch (retail) {
          case retailNames.FALABELLA:
             totalPages = result.state.searchItemList.pagesTotal;
            break;
          case retailNames.RIPLEY:
            totalPages = result.pagination.totalPages;
          default:
            break;
        }
        fs.writeFileSync("prodList" + retail + page + ".json", JSON.stringify(result)); //en este paso se guarda en json

      }

      console.debug("Pagina: "+page+"Paginas totales: "+totalPages);
      if (totalPages > page) {
        page++;
        GetBikesDataFromPage(retail, false, page);
        return;
      } else if (retailNames.RIPLEY != retail) {
        GetBikesDataFromPage(retailNames.RIPLEY, false, 1);
        return;
      }

       StartServer();
    }
  );
}




function findTextAndReturnRemainder(target, variable) {
  var chopFront = target.substring( //corta la parte de adelante, lo que etsa dentro del script 
    target.search(variable) + variable.length,
    target.length
  );
  var result = chopFront.substring(0, chopFront.search("};")+1); //substring recorta desde un index hasta otro
  return result;
}


console.log("Scrap finished");

function StartServer() {
  app.use(express.static("public"));
  app.set("view engine", "ejs");

  let productsRipley = [];
  let productsFalabella = [];

 addItemToProduct(productsFalabella,retailNames.FALABELLA);
 addItemToProduct(productsRipley,retailNames.RIPLEY);
  

  app.get("/", function (req, res) {
    res.render("index", {
      productListFalabella: productsFalabella,
      productListRipley: productsRipley
    });
  });

  function addItemToProduct(productList,retail)
  {
    fs.readdirSync("./").forEach(file => {
      // console.log(file);
      if (file.includes("prodList"+retail)) {
        var bikesData = fs.readFileSync(file);
        bikesData = JSON.parse(bikesData);
        switch (retail) {
          case retailNames.FALABELLA:
            bikesData.state.searchItemList.resultList.forEach(product => {
              let _title = product.title;
              let _price = product.prices[0].originalPrice;
              productList.push({
                title: _title,
                price: _price
              })
              //        console.log("Product name: " + title + " | Price: " + price);
            });
            break;
            case retailNames.RIPLEY:
                bikesData.products.forEach(product => {
                  let _title = product.name;
                  let _price = product.prices.listPrice;
                  productList.push({
                    title: _title,
                    price: _price
                  })
                  //        console.log("Product name: " + title + " | Price: " + price);
                });
            break
        
          default:
            break;
        }
      
      }
    });
  }


  app.listen(3000, function () {
    console.log("escuchando puerto 3000");
  });
}