const Productos = require("../db/models/producto.model");
const { Op } = require("sequelize");
const Categoria = require("../db/models/Categoria.model");
const Marca = require("../db/models/Marca.model");

/* const Graduacion = require("../db/models/Graduacion.model"); */

const cloudinary = require('../services/cloudinari')

//Ver productos

async function getProductos(req, res) {
  try {
    const productos = await Productos.findAll({
      where: {
        Existencias: {
          [Op.gt]: 0, // Utiliza Op.gt (greater than) para obtener solo los productos con Existencias mayores a cero
        },
      },
      include: [
        { model: Categoria, as: "categoria", attributes: ["NombreCategoria"] },
        { model: Marca, as: "marca", attributes: ["NombreMarca"] },
        /*         { model: Graduacion, as: 'graduacion', attributes: ['ValorGraduacion'] } */
      ],
    });
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los productos" });
  }
}


//Ver Ofertas
async function getProductosOfertas(req, res) {
  try {
    const productos = await Productos.findAll({
      where: {
        Existencias: {
          [Op.gt]: 0, // Solo productos con Existencias mayores a cero
        },
        EnOferta: 1, // Solo productos en oferta
      },
      include: [
        { model: Categoria, as: "categoria", attributes: ["NombreCategoria"] },
        { model: Marca, as: "marca", attributes: ["NombreMarca"] },
        /* { model: Graduacion, as: 'graduacion', attributes: ['ValorGraduacion'] } */
      ],
    });
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los productos" });
  }
}
// Desactivar producto
async function desactivarProducto(req, res) {
  try {
    const { id } = req.params;
    const producto = await Productos.findByPk(id);
    if (producto) {
      producto.activo = false;
      producto.Existencias = 0;
      await producto.save();
      res.json({ message: "Producto desactivado correctamente" });
    } else {
      res.status(404).json({ message: "Producto no encontrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al desactivar el producto" });
  }
}

//crear producto
async function createProductos(req, res) {
  const { 
    vchNombreProducto,
    vchDescripcion, 
    Existencias, 
    IdCategoria, 
    IdMarca,
    Precio
  } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha seleccionado ningún archivo.' });
    }

    const filePath = path.join('uploads', req.file.filename);

    // Guardar la URL de la imagen en la base de datos
    const nuevoProducto = await Productos.create({
      vchNombreProducto,
      vchNomImagen: filePath,
      vchDescripcion,
      Existencias, 
      IdCategoria, 
      IdMarca,
      Precio
    });

    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el producto.' });
  }
}


//Busqueda de productos por letra o nombre xd
async function BuscarProducto(req, res) {
  const { busqueda } = req.query;

  try {
    let productos;
    if (busqueda) {
      productos = await Productos.findAll({
        where: {
          vchNombreProducto: {
            [Op.like]: `%${busqueda}%`,
          },
          Existencias: {
            [Op.gt]: 0, // Excluir productos con Existencias igual a cero
          },
        },
      });
    } else {
      productos = await Productos.findAll({
        where: {
          Existencias: {
            [Op.gt]: 0, // Excluir productos con Existencias igual a cero
          },
        },
      });
    }
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los productos" });
  }
}


async function BuscarProductoPorCategoria(req, res) {
  const { categoria, marca } = req.query;

  try {
    let productos;
    if (categoria && categoria.toLowerCase() === "lentes de sol") {
      productos = await Productos.findAll({
        include: [
          {
            model: Categoria,
            as: "categoria",
            where: { NombreCategoria: "Lentes de sol" },
          },
          { model: Marca, as: "marca", attributes: ["NombreMarca"] },
          /*           { model: Graduacion, as: 'graduacion', attributes: ['ValorGraduacion'] } */
        ],
      });
    } else if (categoria && categoria.toLowerCase() === "lentes graduados") {
      productos = await Productos.findAll({
        include: [
          {
            model: Categoria,
            as: "categoria",
            where: { NombreCategoria: "Lentes graduados" },
          },
          { model: Marca, as: "marca", attributes: ["NombreMarca"] },
          /*           { model: Graduacion, as: 'graduacion', attributes: ['ValorGraduacion'] } */
        ],
      });
    } else if (
      marca &&
      (marca.toLowerCase() === "ray-ban" ||
        marca.toLowerCase() === "casio" ||
        marca.toLowerCase() === "oakley")
    ) {
      productos = await Productos.findAll({
        include: [
          {
            model: Marca,
            as: "marca",
            where: {
              NombreMarca: marca.charAt(0).toUpperCase() + marca.slice(1),
            },
          },
          {
            model: Categoria,
            as: "categoria",
            attributes: ["NombreCategoria"],
          },
          /*           { model: Graduacion, as: 'graduacion', attributes: ['ValorGraduacion'] } */
        ],
      });
    } else {
      productos = await Productos.findAll({
        include: [
          { model: Marca, as: "marca", attributes: ["NombreMarca"] },
          {
            model: Categoria,
            as: "categoria",
            attributes: ["NombreCategoria"],
          },
          /*           { model: Graduacion, as: 'graduacion', attributes: ['ValorGraduacion'] } */
        ],
      });
    }
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los productos" });
  }
}

const ProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Productos.findByPk(id, {
      include: [
        { model: Categoria, as: "categoria", attributes: ["NombreCategoria"] },
        { model: Marca, as: "marca", attributes: ["NombreMarca"] },
      ],
    });

    if (!producto) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { vchNombreProducto, vchDescripcion, Precio, Existencias, IdCategoria, IdMarca, vchNomImagen } = req.body;

    const producto = await Productos.findByPk(id);

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    producto.vchNombreProducto = vchNombreProducto || producto.vchNombreProducto;
    producto.vchDescripcion = vchDescripcion || producto.vchDescripcion;
    producto.Precio = Precio || producto.Precio;
    producto.Existencias = Existencias || producto.Existencias;
    producto.IdCategoria = IdCategoria || producto.IdCategoria;
    producto.IdMarca = IdMarca || producto.IdMarca;
    producto.vchNomImagen = vchNomImagen || producto.vchNomImagen;

    await producto.save();

    res.json({ message: "Producto actualizado con éxito", producto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el producto" });
  }
};

async function deleteProducto(req, res) {
  try {
    const { id } = req.params;
    const producto = await Productos.findByPk(id);

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    await producto.destroy();

    res.json({ message: "Producto eliminado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el producto" });
  }
}


async function updateProductosExistencias(req, res) {
  try {
      const { detalleCarrito } = req.body;
      detalleCarrito.forEach(async (detalle) => {
          const producto = await Productos.findByPk(detalle.IdProducto);
          if (producto) {
              producto.Existencias -= detalle.Cantidad;
              await producto.save();
          }
      });
      res.json({ message: "Existencias actualizadas correctamente" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al actualizar las existencias" });
  }
}



module.exports = {
  getProductos,
  getProductosOfertas,
  desactivarProducto,
  createProductos,
  BuscarProducto,
  BuscarProductoPorCategoria,
  ProductoPorId,
  updateProducto,
  deleteProducto,
  updateProductosExistencias
  /*     BuscarProductoPorMarca */
};