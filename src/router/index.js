// src/store/index.js
import Vue from 'vue';
import Vuex from 'vuex';
import { initialKanbanData } from '@/db/initialKanbanData'; // Correct path

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    boards: [],
    allCards: [], // New state to hold all cards
    boardCards: [], // This will still hold cards specific to the currently viewed board
    card: {
      title: '',
      description: '',
      status: '',
      comments: []
    },
    isLoadingBoards: false,
    boardsError: null,
  },
  mutations: {
    SET_BOARDS(state, data) {
      state.boards = data;
    },
    SET_ALL_CARDS(state, data) { // New mutation to set all cards
      state.allCards = data;
    },
    SET_BOARD_CARDS(state, data) {
      state.boardCards = data;
    },
    SET_CURRENT_CARD(state, data) {
      state.card = data;
    },
    DELETE_BOARD(state, boardIdToDelete) {
      state.boards = state.boards.filter((board) => {
        return board.id !== boardIdToDelete;
      });
      // Also delete associated cards when a board is deleted
      state.allCards = state.allCards.filter(card => card.boardId !== boardIdToDelete);
      // Clear boardCards if the deleted board was the current one
      if (state.boardCards.length > 0 && state.boardCards[0].boardId === boardIdToDelete) {
        state.boardCards = [];
      }
    },
    SET_LOADING_BOARDS(state, status) {
      state.isLoadingBoards = status;
    },
    SET_BOARDS_ERROR(state, error) {
      state.boardsError = error;
    },
    ADD_NEW_BOARD(state, newBoard) {
      // Find the max ID across boards and cards to generate a truly unique ID
      const maxBoardId = state.boards.reduce((max, board) => Math.max(max, board.id), 0);
      const maxCardId = state.allCards.reduce((max, card) => Math.max(max, card.id), 0);
      newBoard.id = Math.max(maxBoardId, maxCardId) + 1; // Ensure a unique ID
      state.boards.push(newBoard);
    },
    ADD_NEW_CARD(state, newCard) { // New mutation to add a new card
      const maxBoardId = state.boards.reduce((max, board) => Math.max(max, board.id), 0);
      const maxCardId = state.allCards.reduce((max, card) => Math.max(max, card.id), 0);
      newCard.id = Math.max(maxBoardId, maxCardId) + 1; // Ensure a unique ID
      state.allCards.push(newCard);
    }
  },
  actions: {
    fetchKanbanData({ commit }) {
      commit('SET_LOADING_BOARDS', true);
      commit('SET_BOARDS_ERROR', null);

      try {
        // Commit both boards and cards from the initial data
        commit('SET_BOARDS', initialKanbanData.boards);
        commit('SET_ALL_CARDS', initialKanbanData.cards);
      } catch (error) {
        console.error("Error loading Kanban data:", error);
        commit('SET_BOARDS_ERROR', 'Failed to load Kanban data.');
      } finally {
        commit('SET_LOADING_BOARDS', false);
      }
    },
    addBoard({ commit }, newBoard) {
      commit('ADD_NEW_BOARD', newBoard);
      // If you're using this for a real app, you'd likely send this to an API
      // and then refetch or update the store with the API's response (e.g., ID).
    },
    addCard({ commit }, newCard) { // New action to add a card
      commit('ADD_NEW_CARD', newCard);
    },
    // Action to fetch cards for a specific board (called from Board.vue)
    fetchBoardCards({ commit, state }, boardId) {
      const cardsForBoard = state.allCards.filter(card => card.boardId === boardId);
      commit('SET_BOARD_CARDS', cardsForBoard);
    },
    // Action to fetch a specific card (called from CardDetails.vue)
    fetchCardDetails({ commit, state }, cardId) {
      const card = state.allCards.find(c => c.id === cardId);
      if (card) {
        // You would also filter comments here if you want to display them
        // For simplicity, assuming comments are part of the card object if needed,
        // or fetched separately if you had 'comments' in your initialKanbanData.
        commit('SET_CURRENT_CARD', card);
      } else {
        // Handle case where card is not found
        console.warn(`Card with ID ${cardId} not found.`);
        commit('SET_CURRENT_CARD', null); // Or an empty card object
      }
    }
  },
  getters: {
    allBoards: state => state.boards,
    isLoadingBoards: state => state.isLoadingBoards,
    boardsError: state => state.boardsError,
    // Getter to retrieve cards for a specific board ID
    getCardsForBoard: (state) => (boardId) => {
      return state.allCards.filter(card => card.boardId === boardId);
    },
    // Getter to retrieve a specific card by ID
    getCardById: (state) => (cardId) => {
      return state.allCards.find(card => card.id === cardId);
    },
    currentCard: state => state.card // New getter for the current selected card
  },
  modules: {}
});