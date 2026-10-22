<template><div data-tour="fixo"></div><div :data-tour="i === 0 ? 'dinamico' : null"></div><li v-for="item in menu" :data-tour="`menu-${item.chave}`"></li></template>
