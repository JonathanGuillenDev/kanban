import Vue from 'vue';
import VueRouter from 'vue-router';
import BoardsList from '../components/BoardsList.vue'; // Your main boards list
import CardsList from '../components/CardsList.vue';   // The component that shows cards for a specific board
import CardDetail from '../components/CardDetail.vue'; // Component for individual card details
import CardForm from '../components/CardForm.vue';     // Component for adding/editing cards

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: BoardsList
  },
  {
    path: '/board/:id', // Route for a specific board, :id is the board ID
    name: 'Board',
    component: CardsList
  },
  {
    path: '/board/:boardID/card/:cardID', // Route for a specific card within a board
    name: 'CardDetail',
    component: CardDetail
  },
  {
    path: '/board/:boardID/add-card', // Route for adding a new card to a board
    name: 'AddCard',
    component: CardForm,
    props: { cardID: 0 } // Pass a default cardID of 0 for new cards
  },
  {
    path: '/board/:boardID/edit-card/:cardID', // Route for editing an existing card
    name: 'EditCard',
    component: CardForm,
    props: true // Pass route params as props to the component
  }
];

const router = new VueRouter({
  mode: 'history', // Use history mode for clean URLs
  base: process.env.BASE_URL,
  routes
});

export default router;