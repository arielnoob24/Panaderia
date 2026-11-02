INSERT INTO PRODUCTOS (CAT_Codigo, ETI_Codigo, TIV_Codigo, PRO_Nombre, PRO_Foto,
                       PRO_TextoAlternativo, PRO_Disponible, PRO_Destacado)
SELECT c.CAT_Codigo, NULL, t.TIV_Codigo, 'Tres leches',
       'assets/img/productos/tres-leches',
       'Porción de pastel tres leches cubierta de crema batida y canela',
       TRUE, FALSE
  FROM CATEGORIAS c
  JOIN TARIFAS_IVA t ON t.TIV_CodigoSri = '4'
 WHERE c.CAT_Slug = 'dulces'
ON CONFLICT (PRO_Nombre) DO NOTHING;

INSERT INTO PRODUCTOS_TAMANOS (PRO_Codigo, TAM_Codigo, PTA_Precio, PTA_Orden)
SELECT p.PRO_Codigo, t.TAM_Codigo, 1.00, 1
  FROM PRODUCTOS p
  JOIN TAMANOS t ON t.TAM_Descripcion = 'Único'
 WHERE p.PRO_Nombre = 'Tres leches'
ON CONFLICT (PRO_Codigo, TAM_Codigo) DO UPDATE
   SET PTA_Precio = EXCLUDED.PTA_Precio,
       PTA_Orden = EXCLUDED.PTA_Orden;
