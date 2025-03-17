const fs = require("fs");
const path = require("path");

// File path for storing products data
const dataFilePath = path.join(__dirname, "products.json");

// Initialize products array
let products = [];

// Load products from file if it exists
function loadProducts() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf8");
      products = JSON.parse(data);
      console.log(`Loaded ${products.length} products from database file`);
    } else {
      // Create empty products file if it doesn't exist
      saveProducts();
      console.log("Created new products database file");
    }
  } catch (error) {
    console.error("Error loading products from file:", error.message);
  }
}

// Save products to file
function saveProducts() {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving products to file:", error.message);
  }
}

// Get all products
function getProducts() {
  return products;
}

// Get product by ID
function getProductById(id) {
  return products.find((product) => product.id === id);
}

// Add a new product
function addProduct(productData) {
  const newId =
    products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;

  const newProduct = { ...productData, id: newId };
  products.push(newProduct);
  saveProducts();
  return newProduct;
}

// Update an existing product
function updateProduct(id, updatedData) {
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return null;

  products[index] = { ...products[index], ...updatedData };
  saveProducts();
  return products[index];
}

// Delete a product
function deleteProduct(id) {
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return false;

  products.splice(index, 1);
  saveProducts();
  return true;
}

// Initialize by loading products
loadProducts();

module.exports = {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
};
