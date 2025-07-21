<template>
  <div>
    <div class="loading" v-if="isLoading">
      <img src="../assets/ping_pong_loader.gif" alt="Loading..." />
    </div>
    <div v-else>
      <h1>{{ currentCard.title }}</h1>
      <p>{{ currentCard.description }}</p>
      <router-link
        tag="button"
        :to="{ name: 'EditCard', params: { cardID: $route.params.cardID } }"
        class="btn editCard"
      >Edit Card</router-link>
      <button class="btn deleteCard" v-on:click="showDeleteConfirm = true">Delete Card</button>
      <div class="status-message error" v-show="errorMsg !== ''">{{ errorMsg }}</div>
      <comments-list :comments="currentCard.comments" />
    </div>

    <div class="board-actions" v-if="!isLoading">
      <router-link :to="{ name: 'Board', params: { id: $route.params.boardID } }">Back to Board</router-link>
    </div>

    <div class="modal-overlay" v-if="showAlert">
      <div class="modal-content">
        <p>{{ alertMessage }}</p>
        <button class="btn" @click="showAlert = false">OK</button>
      </div>
    </div>

    <div class="modal-overlay" v-if="showDeleteConfirm">
      <div class="modal-content">
        <p>Are you sure you want to delete this card? This action cannot be undone.</p>
        <button class="btn btn-confirm" @click="deleteCardConfirmed">Yes, Delete</button>
        <button class="btn btn-cancel" @click="showDeleteConfirm = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import CommentsList from "@/components/CommentsList";
import { mapGetters, mapActions } from 'vuex'; // Import mapGetters and mapActions

export default {
  name: "card-detail",
  components: {
    CommentsList
  },
  data() {
    return {
      isLoading: true,
      errorMsg: "",
      showAlert: false,
      alertMessage: "",
      showDeleteConfirm: false,
    };
  },
  methods: {
    ...mapActions(['fetchCardDetail', 'deleteExistingCard']), // Map actions

    async retrieveCard() {
      this.isLoading = true;
      this.errorMsg = "";
      try {
        await this.fetchCardDetail(this.$route.params.cardID);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.showAlertMessage("Card not available. This card may have been deleted or you have entered an invalid card ID.");
          this.$router.push("/");
        } else {
          this.handleError(error, "Error retrieving card.");
        }
      } finally {
        this.isLoading = false;
      }
    },
    async deleteCardConfirmed() {
      this.showDeleteConfirm = false; // Close the confirmation modal
      try {
        const response = await this.deleteExistingCard({
          cardId: this.currentCard.id,
          boardId: this.currentCard.boardId
        });
        if (response.status === 200) {
          this.showAlertMessage("Card successfully deleted");
          this.$router.push(`/board/${this.currentCard.boardId}`);
        }
      } catch (error) {
        this.handleError(error, "Error deleting card.");
      }
    },
    showAlertMessage(message) {
      this.alertMessage = message;
      this.showAlert = true;
    },
    handleError(error, message) {
      if (error.response) {
        this.errorMsg = `${message} Response received was '${error.response.statusText}'.`;
      } else if (error.request) {
        this.errorMsg = `${message} Server could not be reached.`;
      } else {
        this.errorMsg = `${message} Request could not be created.`;
      }
      console.error(error);
    }
  },
  created() {
    this.retrieveCard();
  },
  computed: {
    ...mapGetters(['currentCard']) // Map the currentCard getter
  }
};
</script>

<style scoped>
/* Styles remain the same */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; /* Ensure it's on top of everything */
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.modal-content p {
  margin-bottom: 20px;
  font-size: 1.1em;
}

.modal-content .btn {
  margin: 0 10px;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
}

.modal-content .btn-confirm {
  background-color: #dc3545; /* Red for delete confirmation */
  color: white;
}

.modal-content .btn-confirm:hover {
  background-color: #bd2130;
}

.modal-content .btn-cancel {
  background-color: #6c757d; /* Grey for cancel */
  color: white;
}

.modal-content .btn-cancel:hover {
  background-color: #5a6268;
}

/* Existing styles for the card details */
.loading {
  text-align: center;
  padding: 50px;
}

.loading img {
  width: 50px;
  height: 50px;
}

h1 {
  font-size: 1.5em;
  margin-bottom: 10px;
}

p {
  font-size: 1.1em;
  line-height: 1.6;
}

.btn.editCard {
  color: #fff;
  background-color: #508ca8;
  border-color: #508ca8;
  margin-bottom: 10px;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
}
.btn.editCard:hover {
  background-color: #407c91;
}

.btn.deleteCard {
  color: #fff;
  background-color: #ef031a;
  border-color: #ef031a;
  margin-bottom: 10px;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
}
.btn.deleteCard:hover {
  background-color: #d10217;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
}

.board-actions {
  margin-top: 30px;
  text-align: center;
}

.board-actions a {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
}

.board-actions a:hover {
  text-decoration: underline;
}
</style>