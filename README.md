# Portal Administrativo

- Caddy é essencialmente um servidor HTTP usado para servir o Frontend desenvolvido em ReactJs
  https://caddyserver.com/docs/install

  Pasta em que se hospeda os arquivos: /usr/share/caddy
  É necessário ajustar as permissões com o comando: sudo chmod -R u=rwx,g=rwx,o=rwx /usr/share/caddy/\*
  Para start: sudo systemctl start caddy && sudo systemctl status caddy
  Para restart: sudo systemctl restart caddy
  Para parar: sudo systemctl stop caddy
