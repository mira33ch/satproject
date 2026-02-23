FROM quay.io/keycloak/keycloak:24.0

COPY realms/ /opt/keycloak/data/import/

RUN /opt/keycloak/bin/kc.sh build

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
