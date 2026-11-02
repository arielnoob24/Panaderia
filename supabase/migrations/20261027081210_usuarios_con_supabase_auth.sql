ALTER TABLE usuarios
  DROP CONSTRAINT ck_usuarios_huellaclave,
  DROP CONSTRAINT ck_usuarios_sal,
  DROP CONSTRAINT ck_usuarios_iteraciones,
  DROP COLUMN usu_huellaclave,
  DROP COLUMN usu_sal,
  DROP COLUMN usu_iteraciones,
  ADD COLUMN usu_codigoauth UUID NOT NULL,
  ADD CONSTRAINT uq_usuarios_codigoauth UNIQUE (usu_codigoauth),
  ADD CONSTRAINT fk_usuarios_auth FOREIGN KEY (usu_codigoauth)
      REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE RESTRICT;;
