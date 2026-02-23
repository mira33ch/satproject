FROM quay.io/keycloak/keycloak:24.0

# If you have realm export JSON files
# Put them under keycloak/realms/
COPY realms/ /opt/keycloak/data/import/

# If you have custom themes
# COPY themes/ /opt/keycloak/themes/

RUN /opt/keycloak/bin/kc.sh build

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
