# 🛠️ Guía de Mantenimiento y Operaciones del Droplet (DigitalOcean)
## Entorno: Ubuntu | 2GB RAM | Easypanel | PostgreSQL

Esta guía contiene las instrucciones necesarias para la administración, optimización y mantenimiento preventivo del servidor droplet en DigitalOcean.

---

## 📅 Lista de Tareas de Mantenimiento

| Frecuencia | Tarea | Área | Comando Principal |
| :--- | :--- | :--- | :--- |
| **Inicial** | Configurar Swap Space y Log Rotation | Memoria y Disco | `fallocate`, `/etc/docker/daemon.json` |
| **Semanal** | Limpieza de caché de Docker | Disco | `docker system prune -a --volumes -f` |
| **Semanal** | Monitorear uso de memoria RAM y OOM | Memoria | `free -h` y `dmesg -T` |
| **Mensual** | Actualizaciones de seguridad del OS | Seguridad | `apt update && apt upgrade` |
| **Mensual** | Optimización y Vacuum en PostgreSQL | Base de Datos | `VACUUM ANALYZE;` |

---

## 🚀 1. Configuración de un Nuevo Droplet (Inicial)

Ejecuta estos pasos en orden al aprovisionar un nuevo servidor para proteger el sistema contra bloqueos por falta de memoria (RAM) y saturación del disco.

### Paso A: Crear 4GB de Memoria Swap (RAM Virtual)
Esto evita que los procesos (como las compilaciones de Next.js o el contenedor de Postgres) sean terminados abruptamente por el Kernel de Linux (OOM Killer).
```bash
# Apagar el swap actual si existiera
sudo swapoff -a

# Crear un archivo swap de 4GB
sudo fallocate -l 4G /swapfile

# Asignar permisos correctos
sudo chmod 600 /swapfile

# Configurar el archivo como espacio swap
sudo mkswap /swapfile

# Activar el swap
sudo swapon /swapfile

# Hacer que el swap sea permanente ante reinicios (añadir al final de /etc/fstab)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Ajustar swappiness a 30 (optimiza la agresividad de uso de swap)
sudo sysctl vm.swappiness=30
echo 'vm.swappiness = 30' | sudo tee -a /etc/sysctl.conf
```

### Paso B: Limitar Logs de Docker (Evita llenar el disco de logs)
1. Edita o crea el archivo `/etc/docker/daemon.json`:
   ```bash
   sudo nano /etc/docker/daemon.json
   ```
2. Agrega la siguiente configuración:
   ```json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```
3. Reinicia Docker para aplicar los cambios:
   ```bash
   sudo systemctl restart docker
   ```

### Paso C: Asegurar con Firewall (UFW)
Asegura el droplet cerrando los puertos de base de datos (`5432`) o n8n (`5678`) al público exterior y abriendo solo los necesarios.
```bash
# Definir reglas por defecto
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir puertos de red esenciales
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# Activar Firewall
sudo ufw enable
```

---

## 📅 2. Tareas Semanales

### A. Pruning Semanal de Docker (Limpieza de Disco)
Las compilaciones frecuentes acumulan imágenes y capas de caché inservibles que pueden llenar rápidamente los 25GB o 50GB del droplet.
```bash
sudo docker system prune -a --volumes -f
```
*(Para automatizarlo, puedes programar un cron job con `sudo crontab -e` y agregar la siguiente línea al final: `0 3 * * 0 docker system prune -a -f --volumes > /var/log/docker_prune.log 2>&1`)*

### B. Monitoreo de RAM y Detección de OOM (Out Of Memory)
Si notas que la app web o la base de datos se reinician solas, verifica el uso de memoria virtual y si el kernel mató algún proceso:
```bash
# Revisar memoria disponible en tiempo real
free -h

# Buscar si algún proceso fue eliminado por OOM
sudo dmesg -T | grep -i -E 'kill|oom'
```

---

## 📅 3. Tareas Mensuales

### A. Actualizaciones de Seguridad de Ubuntu
Mantén el sistema operativo protegido de vulnerabilidades:
```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```
> [!IMPORTANT]
> Si se actualiza el kernel del sistema, agenda un reinicio del droplet en un horario sin tráfico:
> ```bash
> sudo reboot
> ```

### B. Vacuum Manual en PostgreSQL
Si existen tablas con un volumen extremadamente alto de escritura, actualizaciones o eliminaciones, corre una limpieza para liberar el espacio de registros muertos:
```sql
-- Ejecutar en la base de datos PostgreSQL mediante psql o interfaz SQL
VACUUM ANALYZE;
```

---

## 🚨 4. Protocolo de Emergencia (Espacio en Disco al 100%)

Si el droplet se bloquea o los servicios empiezan a fallar porque el almacenamiento está completamente lleno:

1. **Identificar directorios pesados:**
   ```bash
   sudo du -sh /* 2>/dev/null | sort -rh | head -n 10
   ```
2. **Pruning completo de Docker de emergencia:**
   ```bash
   sudo docker system prune -a -f --volumes
   ```
3. **Limpiar registros del sistema (Journal logs):**
   ```bash
   sudo journalctl --vacuum-size=100M
   ```
4. **Truncar logs de Docker en caliente (sin detener contenedores):**
   ```bash
   sudo sh -c 'truncate -s 0 /var/lib/docker/containers/*/*-json.log'
   ```
