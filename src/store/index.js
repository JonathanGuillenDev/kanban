// src/store/index.js
import Vue from 'vue';
import Vuex from 'vuex';
import { initialKanbanData } from '@/db/initialKanbanData'; // This import belongs HERE!
import BoardService from '@/services/BoardService'; // Ensure this path is correct if you're keeping the service

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
    },
    UPDATE_CARD_IN_BOARD(state, updatedCard) {
        // Find the card in boardCards and update it
        const indexInBoardCards = state.boardCards.findIndex(card => card.id === updatedCard.id);
        if (indexInBoardCards !== -1) {
            state.boardCards.splice(indexInBoardCards, 1, updatedCard);
        }

        // Also update the card within the specific board in the 'boards' array
        state.boards.forEach(board => {
            if (board.id === updatedCard.boardId && board.cards) {
                const indexInBoard = board.cards.findIndex(card => card.id === updatedCard.id);
                if (indexInBoard !== -1) {
                    board.cards.splice(indexInBoard, 1, updatedCard);
                }
            }
        });
    },
    DELETE_CARD_FROM_BOARD(state, { boardId, cardId }) {
        // Filter out the deleted card from boardCards
        state.boardCards = state.boardCards.filter(card => card.id !== cardId);

        // Filter out the deleted card from the specific board in the 'boards' array
        state.boards.forEach(board => {
            if (board.id === boardId && board.cards) {
                board.cards = board.cards.filter(card => card.id !== cardId);
            }
        });
    },
  },
  actions: {
    async fetchKanbanData({ commit }) {
      commit('SET_LOADING_BOARDS', true);
      commit('SET_BOARDS_ERROR', null);
      try {
        // If you are still using BoardService for initial data, keep this:
        const response = await BoardService.getBoards(); // Assuming getBoards returns { boards: [...], cards: [...] }
        commit('SET_BOARDS', response.data.boards);
        commit('SET_ALL_CARDS', response.data.cards);
        // If you are embedding the data directly:
        // commit('SET_BOARDS', initialKanbanData.boards);
        // commit('SET_ALL_CARDS', initialKanbanData.cards);
      } catch (error) {
        commit('SET_BOARDS_ERROR', 'Error loading boards.');
        console.error("Error fetching boards:", error);
      } finally {
        commit('SET_LOADING_BOARDS', false);
      }
    },
    async addBoard({ commit }, newBoard) {
        try {
            const response = await BoardService.addBoard(newBoard);
            if (response.status === 201) {
                commit('ADD_NEW_BOARD', response.data); // Assuming API returns the new board with ID
            }
        } catch (error) {
            console.error("Error adding board:", error);
            throw error;
        }
    },
    async addCard({ commit }, newCardData) {
        try {
            const response = await BoardService.addCard(newCardData);
            if (response.status === 201) {
                commit('ADD_NEW_CARD', response.data); // Assuming API returns the new card with ID
            }
            return response;
        } catch (error) {
            console.error("Error adding new card:", error);
            throw error;
        }
    },
    async updateExistingCard({ commit }, updatedCardData) {
        try {
            const response = await BoardService.updateCard(updatedCardData);
            if (response.status === 200) {
                commit('UPDATE_CARD_IN_BOARD', response.data);
            }
            return response;
        } catch (error) {
            console.error("Error updating card:", error);
            throw error;
        }
    },
    async deleteExistingCard({ commit }, { cardId, boardId }) {
        try {
            const response = await BoardService.deleteCard(cardId);
            if (response.status === 200) {
                commit('DELETE_CARD_FROM_BOARD', { boardId, cardId });
            }
            return response;
        } catch (error) {
            console.error("Error deleting card:", error);
            throw error;
        }
    },
    async deleteBoard({ commit }, boardId) {
        try {
            const response = await BoardService.deleteBoard(boardId);
            if (response.status === 200) {
                commit('DELETE_BOARD', boardId);
            }
            return response;
        } catch (error) {
            console.error("Error deleting board:", error);
            throw error;
        }
    },
    // Action to fetch cards for a specific board (called from CardsList.vue)
    fetchBoardCards({ commit, state }, boardId) {
        // This action now filters from `allCards` already in the store
        const cardsForBoard = state.allCards.filter(card => card.boardId === boardId);
        commit('SET_BOARD_CARDS', cardsForBoard);
    },
    // Action to fetch a specific card (called from CardDetails.vue and CardForm.vue)
    fetchCardDetail({ commit, state }, cardId) {
        const card = state.allCards.find(c => c.id === cardId);
        if (card) {
            // Filter comments for this card from initialKanbanData.comments if available
            const cardComments = initialKanbanData.comments.filter(comment => comment.cardId === cardId);
            const cardWithComments = { ...card, comments: cardComments };
            commit('SET_CURRENT_CARD', cardWithComments);
        } else {
            console.warn(`Card with ID ${cardId} not found.`);
            commit('SET_CURRENT_CARD', null);
            throw new Error('Card not found'); // Throw an error to be caught by component
        }
    }
  },
  getters: {
    allBoards: state => state.boards,
    isLoadingBoards: state => state.isLoadingBoards,
    boardsError: state => state.boardsError,
    currentCard: state => state.currentCard,
    // Getter to retrieve cards for a specific board ID
    getCardsForBoard: (state) => (boardId) => {
        // This getter now works with `allCards` which is populated on initial `fetchKanbanData`
        return state.allCards.filter(card => card.boardId === boardId);
    }
  },
  modules: {}
});