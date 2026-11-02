INSERT INTO PRODUCTOS (CAT_Codigo, ETI_Codigo, TIV_Codigo, PRO_Nombre, PRO_Foto,
                       PRO_TextoAlternativo, PRO_Disponible, PRO_Destacado)
SELECT c.CAT_Codigo, NULL, t.TIV_Codigo, v.nombre,
       'assets/img/productos/' || v.foto, v.alt, TRUE, FALSE
  FROM (VALUES
        (18, 'dulces',        '4', 'Alfajor',                   'alfajor',                   'Alfajor relleno de dulce de leche y espolvoreado con azúcar glas'),
        (19, 'bebidas-frias', '4', 'Avena Toni',                'avena-toni',                'Envase individual de bebida de avena Toni'),
        (20, 'dulces',        '4', 'Brownie',                   'brownie',                   'Porción cuadrada de brownie de chocolate'),
        (21, 'panes',         '0', 'Cacho',                     'cacho',                     'Cacho de masa hojaldrada, dorado y curvado'),
        (22, 'panes',         '0', 'Empanada de queso y jamón', 'empanada-de-queso-y-jamon', 'Empanada horneada rellena de queso y jamón, abierta para mostrar el relleno'),
        (23, 'bebidas-frias', '4', 'Fioravanti fresa',          'fioravanti-fresa',          'Botella de Fioravanti sabor fresa'),
        (24, 'bebidas-frias', '4', 'Güitig',                    'guitig',                    'Botella de agua mineral Güitig con gas'),
        (25, 'panes',         '0', 'Injerto',                   'injerto',                   'Panecillo redondo de corteza dorada'),
        (26, 'panes',         '0', 'Pan integral',              'pan-integral',              'Pan redondo integral con semillas en la superficie'),
        (27, 'dulces',        '4', 'Quesadilla',                'quesadilla',                'Porción de quesadilla horneada con ajonjolí por encima'),
        (28, 'dulces',        '4', 'Tarta de frutas',           'tarta-de-frutas',           'Porción de tarta con crema y frutas frescas'),
        (29, 'bebidas-frias', '4', 'Yogurt Toni',               'yogurt-toni',               'Envase individual de yogur Toni sabor fresa')
       ) AS v (orden, categoria, iva_sri, nombre, foto, alt)
  JOIN CATEGORIAS c  ON c.CAT_Slug = v.categoria
  JOIN TARIFAS_IVA t ON t.TIV_CodigoSri = v.iva_sri
 ORDER BY v.orden
ON CONFLICT (PRO_Nombre) DO NOTHING;

INSERT INTO PRODUCTOS_TAMANOS (PRO_Codigo, TAM_Codigo, PTA_Precio, PTA_Orden)
SELECT p.PRO_Codigo, t.TAM_Codigo, v.precio, 1
  FROM (VALUES
        ('Alfajor',                   0.75),
        ('Avena Toni',                0.85),
        ('Brownie',                   1.50),
        ('Cacho',                     0.35),
        ('Empanada de queso y jamón', 1.00),
        ('Fioravanti fresa',          0.85),
        ('Güitig',                    0.85),
        ('Injerto',                   0.40),
        ('Pan integral',              0.50),
        ('Quesadilla',                0.75),
        ('Tarta de frutas',           2.00),
        ('Yogurt Toni',               0.85)
       ) AS v (producto, precio)
  JOIN PRODUCTOS p ON p.PRO_Nombre = v.producto
  JOIN TAMANOS t ON t.TAM_Descripcion = 'Único'
ON CONFLICT (PRO_Codigo, TAM_Codigo) DO UPDATE
   SET PTA_Precio = EXCLUDED.PTA_Precio,
       PTA_Orden = EXCLUDED.PTA_Orden;
