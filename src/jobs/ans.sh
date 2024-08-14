#!/usr/bin/expect -f
 
set timeout 1
 
spawn ./que.sh

expect "Password:\r"

send -- "postgres"

expect eof
