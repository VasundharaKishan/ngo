#!/bin/bash

export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH=$JAVA_HOME/bin:$PATH

cd /Users/e141057/Desktop/work/ngo/foundation-backend

echo "🔨 Compiling backend..."
/opt/homebrew/bin/mvn clean compile -DskipTests

echo "🚀 Starting backend..."
/opt/homebrew/bin/mvn org.springframework.boot:spring-boot-maven-plugin:3.2.1:run -DskipTests
