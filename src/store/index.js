// src/store/index.js
import Vue from 'vue';
import Vuex from 'vuex';
import { initialKanbanData } from '../db/initialKanbanData.js'; // FIX: Corrected import path
// REMOVED: import BoardService from '@/services/BoardService'; // No longer needed for Option A

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
      state.allCards = state.allCards.filter(card => card.boardId !== boardIdToDelete);
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
      const maxBoardId = state.boards.reduce((max, board) => Math.max(max, board.id), 0);
      const maxCardId = state.allCards.reduce((max, card) => Math.max(max, card.id), 0);
      newBoard.id = Math.max(maxBoardId, maxCardId) + 1;
      state.boards.push(newBoard);
    },
    ADD_NEW_CARD(state, newCard) {
      const maxBoardId = state.boards.reduce((max, board) => Math.max(max, board.id), 0);
      const maxCardId = state.allCards.reduce((max, card) => Math.max(max, card.id), 0);
      newCard.id = Math.max(maxBoardId, maxCardId) + 1;
      state.allCards.push(newCard);
    },
    UPDATE_CARD_IN_BOARD(state, updatedCard) {
        // Find and update in allCards
        const allCardsIndex = state.allCards.findIndex(card => card.id === updatedCard.id);
        if (allCardsIndex !== -1) {
            state.allCards.splice(allCardsIndex, 1, updatedCard);
        }
        // Update in boardCards if it's the currently displayed board
        const boardCardsIndex = state.boardCards.findIndex(card => card.id === updatedCard.id);
        if (boardCardsIndex !== -1) {
            state.boardCards.splice(boardCardsIndex, 1, updatedCard);
        }
    },
    DELETE_CARD_FROM_BOARD(state, { boardId, cardId }) {
        // Filter out from allCards
        state.allCards = state.allCards.filter(card => card.id !== cardId);
        // Filter out from boardCards if it's the currently displayed board
        state.boardCards = state.boardCards.filter(card => card.id !== cardId);
    },
  },
  actions: {
    // FIX: This action now directly uses initialKanbanData
    async fetchKanbanData({ commit }) {
      commit('SET_LOADING_BOARDS', true);
      commit('SET_BOARDS_ERROR', null);
      try {
        // Directly commit data from initialKanbanData
        commit('SET_BOARDS', initialKanbanData.boards);
        commit('SET_ALL_CARDS', initialKanbanData.cards);
        console.log("Kanban data loaded successfully from initialKanbanData:", initialKanbanData.boards, initialKanbanData.cards); // Added console log
      } catch (error) {
        console.error("Error loading Kanban data from initialKanbanData:", error);
        commit('SET_BOARDS_ERROR', 'Failed to load Kanban data from local source.');
      } finally {
        commit('SET_LOADING_BOARDS', false);
      }
    },

    // FIX: These actions now directly commit mutations without BoardService
    addBoard({ commit }, newBoard) {
      commit('ADD_NEW_BOARD', newBoard);
      console.log("New board added locally:", newBoard);
    },
    addCard({ commit }, newCardData) {
      commit('ADD_NEW_CARD', newCardData);
      console.log("New card added locally:", newCardData);
    },
    updateExistingCard({ commit }, updatedCardData) {
      commit('UPDATE_CARD_IN_BOARD', updatedCardData);
      console.log("Card updated locally:", updatedCardData);
    },
    deleteExistingCard({ commit }, { cardId, boardId }) {
      commit('DELETE_CARD_FROM_BOARD', { boardId, cardId });
      console.log(`Card ${cardId} deleted locally from board ${boardId}.`);
    },
    deleteBoard({ commit }, boardId) {
      commit('DELETE_BOARD', boardId);
      console.log(`Board ${boardId} deleted locally.`);
    },

    // Action to fetch cards for a specific board (called from CardsList.vue)
    fetchBoardCards({ commit, state }, boardId) {
        const cardsForBoard = state.allCards.filter(card => card.boardId === boardId);
        commit('SET_BOARD_CARDS', cardsForBoard);
    },
    // Action to fetch a specific card (called from CardDetails.vue and CardForm.vue)
    fetchCardDetail({ commit, state }, cardId) {
        const card = state.allCards.find(c => c.id === cardId);
        if (card) {
            // Ensure initialKanbanData.comments exists before filtering
            const cardComments = initialKanbanData.comments ? initialKanbanData.comments.filter(comment => comment.cardId === cardId) : [];
            const cardWithComments = { ...card, comments: cardComments };
            commit('SET_CURRENT_CARD', cardWithComments);
        } else {
            console.warn(`Card with ID ${cardId} not found.`);
            commit('SET_CURRENT_CARD', null);
            throw new Error('Card not found');
        }
    }
  },
  getters: {
    allBoards: state => state.boards,
    isLoadingBoards: state => state.isLoadingBoards,
    boardsError: state => state.boardsError,
    currentCard: state => state.card,
    getCardsForBoard: (state) => (boardId) => {
        return state.allCards.filter(card => card.boardId === boardId);
    }
  },
  modules: {}
});