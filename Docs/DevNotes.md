# Dev Notes


To check if the backend is working locally:
```bash
curl localhost:8080/api/notes
```

# Check the nginx deployment:

```bash
docker exec -it steamednotes-frontend-1 sh
cd /usr/share/nginx/html 
ls # check whatever needs to be verified for the assets that will be served

cd /etc/nginx
cat nginx.conf # double check the configs
```


# Round trip test
For the round trip tests locally, the vite works great
- It gets request at port 80 and forwards them to 8080 if it has api (mimicking nginx)
- It services frontend normally as expected