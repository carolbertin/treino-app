# Projeto

Aplicativo web para personal trainer.

Hoje o projeto está concentrado em um único arquivo:
- index.html

## Objetivo do app
Ter dois painéis:
- Painel do professor
- Painel do aluno

## Painel professor
- Cadastrar alunos
- Criar e editar treinos
- Prescrever exercícios
- Ver evolução do aluno

## Painel aluno
- Ver treinos prescritos
- Abrir exercício
- Registrar carga e repetições
- Ver último registro
- Usar timer de descanso
- Finalizar treino

## Tecnologias atuais
- HTML
- CSS
- JavaScript
- Firebase
- Google Auth
- Firestore

## Problemas atuais
- Ao clicar em um treino/exercício para editar, a aba fecha ou não abre como esperado
- O sistema de técnicas precisa ficar mais organizado
- Cluster set deve permitir campos separados de repetições, exemplo: 1x4+4+4
- Back-off set e rest-pause precisam ser melhor explicados e estruturados

## Decisão importante
Como o app está inteiro em index.html, qualquer alteração deve ser feita com cuidado.
Não reescrever tudo de uma vez.
Primeiro corrigir bugs pequenos.
Depois pensar em separar o projeto em arquivos.