SELECT FN_USUARIOS_GUARDAR('6a3640d6-ad8f-4b44-ada2-09cb1dd81606'::uuid, 'arielescobar2003@gmail.com', 'Ariel', 'Escobar', '0960868821');
UPDATE USUARIOS
   SET ROL_Codigo = (SELECT ROL_Codigo FROM ROLES WHERE ROL_Nombre = 'Administrador')
 WHERE USU_CodigoAuth = '6a3640d6-ad8f-4b44-ada2-09cb1dd81606';;
