#!/usr/bin/env bash

set -e

usage="Usage: $(basename "$0")
where:
    --service      - the plymouth service being deployed
    --domain       - the domain (plymouth.com or qaplymouth.com)
"

POSITIONAL=()
while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
  --service)
    SERVICE="$2"
    shift # past argument
    shift # past value
    ;;
  --domain)
    DOMAIN="$2"
    shift # past argument
    shift # past value
    ;;
  help | -h | usage | --help)
    echo "$usage"
    exit -1
    ;;
  *)                   # unknown option
    POSITIONAL+=("$1") # save it in an array for later
    shift              # past argument
    ;;
  esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

#GET ADMIN PASSWORD TO DO DATABASE UPGRADE
JSON=$(aws secretsmanager get-secret-value --secret-id AURORA_DB_ADMIN --output json --region us-east-1)
HOST="write.db.$DOMAIN"
ADMIN_PGPASSWORD=($(echo $JSON | jq -r '.SecretString'))

export ADMIN_PGPASSWORD
export HOST

touch ~/.pgpass
echo "$HOST:5432:*:postgres:$ADMIN_PGPASSWORD" >~/.pgpass
chmod 600 ~/.pgpass
PGUSER="${SERVICE}_db_user"
if ! psql -U postgres -h $HOST -lqt | cut -d \| -f 1 | grep -qw $SERVICE; then
  echo "DB DOESNT EXIST"
  PGPASSWORD=""
  if ! aws secretsmanager describe-secret --secret-id $PGUSER --region us-east-1; then
    echo "DATABASE USER SECRET DOESNT EXIST, CREATING ONE"
    echo "CREATING RANDOM PASSWORD"
    JSON=$(aws secretsmanager get-random-password --password-length 20 --exclude-punctuation --require-each-included-type --region us-east-1)
    PGPASSWORD=($(echo $JSON | jq -r '.RandomPassword'))
    aws secretsmanager create-secret --name $PGUSER --secret-string $PGPASSWORD --region us-east-1
  else
    echo "FOUND USER. GETTING DB PASSWORD"
    JSON=$(aws secretsmanager get-secret-value --secret-id $PGUSER --region us-east-1)
    PGPASSWORD=($(echo $JSON | jq -r '.SecretString'))
  fi
  sequelize db:create

  echo "psql -U postgres -h $HOST -c \"REVOKE CONNECT ON DATABASE template1 FROM PUBLIC;\""
  psql -U postgres -h $HOST -c "REVOKE CONNECT ON DATABASE template1 FROM PUBLIC;"

  echo "psql -U postgres -h $HOST -c \"REVOKE CONNECT ON DATABASE postgres FROM PUBLIC;\""
  psql -U postgres -h $HOST -c "REVOKE CONNECT ON DATABASE postgres FROM PUBLIC;"

  echo "psql -U postgres -h $HOST -c \"REVOKE CONNECT ON DATABASE $SERVICE FROM PUBLIC;\""
  psql -U postgres -h $HOST -c "REVOKE CONNECT ON DATABASE $SERVICE FROM PUBLIC;"

  echo "psql -U postgres -h $HOST -c \"CREATE USER $PGUSER WITH ENCRYPTED PASSWORD '**********' NOCREATEDB NOCREATEROLE NOSUPERUSER;\""
  psql -U postgres -h $HOST -c "CREATE USER $PGUSER WITH ENCRYPTED PASSWORD '$PGPASSWORD' NOCREATEDB NOCREATEROLE NOSUPERUSER;"

  echo "psql -U postgres -h $HOST -c \"REVOKE ALL PRIVILEGES ON DATABASE postgres FROM $PGUSER;\""
  psql -U postgres -h $HOST -c "REVOKE ALL PRIVILEGES ON DATABASE postgres FROM $PGUSER;"

  echo "psql -U postgres -h $HOST -c \"GRANT CONNECT ON DATABASE $SERVICE TO $PGUSER;\""
  psql -U postgres -h $HOST -c "GRANT CONNECT ON DATABASE $SERVICE TO $PGUSER;"

  echo "psql -U postgres -h $HOST -c \"GRANT ALL PRIVILEGES ON DATABASE $SERVICE TO $PGUSER;\""
  psql -U postgres -h $HOST -c "GRANT ALL PRIVILEGES ON DATABASE $SERVICE TO $PGUSER;"
fi

export DB_PASSWORD=$PGPASSWORD
sequelize db:migrate
sequelize db:seed:all

echo "psql -U postgres -h $HOST -d $SERVICE -c \"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $PGUSER;\""
psql -U postgres -h $HOST -d $SERVICE -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $PGUSER;"

echo "psql -U postgres -h $HOST -d $SERVICE -c \"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public to $PGUSER;\""
psql -U postgres -h $HOST -d $SERVICE -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public to $PGUSER;"
