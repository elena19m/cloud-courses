## Cronjobs

While regular Jobs are useful from a scheduling point of view, they cannot be set to run periodically or on a set timer.
CronJobs are a mechanism implemented in Kubernetes to enhance the regular Jobs feature.
They are a type of Job which are managed and scheduled by Kubernetes to run at a specific time based on a user-defined rule.

Some use cases which we can define for CronJobs are:
* scheduling regular data exports or backups to off-site facilities
* periodic environment cleanup jobs, for example deleting temporary files or files which have been generated and haven't been used for some time
* crawling endpoint for new data or information

The following is an example manifest for a job:
```
apiVersion: batch/v1
kind: CronJob
metadata:
  name: first-job
spec:
  schedule: "0 2 8 * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: first-job
            image: busybox
            command: ["echo", "First job"]
          restartPolicy: OnFailure
```

The `jobTemplate` specification works as a job specification field, in which we add the requirements for a job.

The `schedule` value is specified using the following convention from the cron manual:
```
# To define the time you can provide concrete values for
# minute (m), hour (h), day of month (dom), month (mon),
# and day of week (dow) or use '*' in these fields (for 'any').
```

This means that the above job will run on the 8th day of the month at 2:00 AM.
If we want to specify a job which would run for every minute we could to the following chane:
```
-  schedule: "0 2 8 * *"
+  schedule: "*/1 * * * *"
```

The `*/x` means the job will run every `x` minutes.

For an easy way to define the cron schedule, you can use https://crontab.guru/.

### Case study: Database backup

For this exercises you have to download the arvhice from the following link: swarm.cs.pub.ro/~sweisz/pgsql.zip

The pgsql.yaml file deploys a database server.
For this database server we need to create backups which will be storen in another volume which will them be deployed off-site.

In order to prepare the setup we first need to create the database that we will be creating.
Run the following command to setup the database deployment and service in the lab directory:

```
oc apply -f pgsql-pvc.yaml
oc apply -f pgsql.yaml
```

We will start from the followin already created CronJob:
```
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "*/1 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup-container
            image: postgres:14-alpine
            command:
            - /bin/sh
            - -c
            - |
              # Set date format for backup filename
              BACKUP_DATE=$(date +\%Y-\%m-\%d-\%H\%M)

              # Create backup
              echo "Starting PostgreSQL backup at $(date)"
              mkdir /tmp/backups
              pg_dump \
                -h ${DB_HOST} \
                -U ${DB_USER} \
                -d ${DB_NAME} \
                -F custom \
                -Z 9 \
                -f /tmp/backups/${DB_NAME}-${BACKUP_DATE}.pgdump

            env:
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: host
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: username
            - name: DB_NAME
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: database
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: password
          restartPolicy: OnFailure
---
# Secret for database credentials
apiVersion: v1
kind: Secret
metadata:
  name: postgres-credentials
type: Opaque
data:
  host: cG9zdGdyZXMtc2VydmljZQ==  # postgres-service (base64 encoded)
  username: YmFja3VwX3VzZXI=        # backup_user (base64 encoded)
  password: c2VjdXJlUGFzc3dvcmQxMjM= # securePassword123 (base64 encoded)
  database: cHJvZHVjdGlvbl9kYg==     # production_db (base64 encoded)
```

The above CronJob creates a backup of the database using `pg_dump` and puts it in a temporary location.

Apply them so we can see the backup in action.

```
sergiu@epsilon:~/ocp/upgrade$ oc get cronjobs
NAME              SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
postgres-backup   */1 * * * *   False     0        35s             39m
```

The issue with the above CronJob is that although it creates a backup file, it doesn't add it to any kind of persistent storage.

Create a persistent volume, mount it to the `/backup` path and change the backup script so that it copies the backup files to the backup volume.

Change the backup schedule so that it only does a backup every hour.

Change the policy so that it can only run one backup job in parallel. Look into the documentation so that you will not allow concurrent jobs: https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/.
