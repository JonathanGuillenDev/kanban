<template>
  <form v-on:submit.prevent="submitForm" class="cardForm">
    <div class="status-message error" v-show="errorMsg !== ''">{{errorMsg}}</div>
    <div class="form-group">
      <label for="title">Title:</label>
      <input id="title" type="text" class="form-control" v-model="card.title" autocomplete="off" required />
    </div>
    <div class="form-group">
      <label for="tag">Tag:</label>
      <select id="tag" class="form-control" v-model="card.tag" required>
        <option value="">-- Select Tag --</option> <option value="Feature Request">Feature Request</option>
        <option value="Design">Design</option>
        <option value="Q&A">Q&A</option>
      </select>
      <label for="cardStatus">Status:</label>
      <select id="cardStatus" class="form-control" v-model="card.status" required>
        <option value="Planned">Planned</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>
    </div>
    <div class="form-group">
      <label for="description">Description:</label>
      <textarea id="description" class="form-control" v-model="card.description"></textarea>
    </div>
    <button class="btn btn-submit" :disabled="isLoading">
      <span v-if="isLoading">Processing...</span>
      <span v-else>Submit</span>
    </button>
    <button class="btn btn-cancel" v-on:click.prevent="cancelForm" type="button">Cancel</button> </form>
</template>

<script>
import moment from "moment";
import { mapActions, mapGetters } from 'vuex';

export default {
  name: "card-form",
  props: {
    cardID: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      card: {
        title: "",
        description: "",
        status: "Planned", // Default status
        tag: "", // Default tag
        date: null,
        // When adding, boardId will be part of the payload, not directly on 'card' initially
        // When editing, boardId will come from existing card, and we add it back.
      },
      isLoading: false, // Added loading state
      errorMsg: ""
    };
  },
  methods: {
    ...mapActions(['addNewCard', 'updateExistingCard', 'fetchCardDetail']),

    async submitForm() {
      this.isLoading = true; // Set loading to true
      this.errorMsg = ""; // Clear previous errors

      // Ensure boardId is available
      const boardId = Number(this.$route.params.boardID);
      if (isNaN(boardId) || boardId === 0) {
        this.errorMsg = "Invalid Board ID. Cannot process card.";
        this.isLoading = false;
        return;
      }

      // Prepare the base card object from local data
      const cardToProcess = {
        title: this.card.title,
        description: this.card.description,
        status: this.card.status,
        tag: this.card.tag,
      };

      if (this.cardID === 0) { // Adding a new card
        cardToProcess.date = moment().format("MMM Do YYYY");

        try {
          // FIX: Pass the payload in the format expected by addNewCard action
          await this.addNewCard({
            boardId: boardId,
            card: cardToProcess // Pass the card object nested under 'card'
          });
          // FIX: No response.status check needed for local store actions
          this.$router.push(`/board/${boardId}`);
        } catch (error) {
          this.handleErrorResponse(error, "adding");
        } finally {
          this.isLoading = false;
        }
      } else { // Updating an existing card
        cardToProcess.id = this.cardID;
        cardToProcess.boardId = boardId; // Ensure boardId is part of the card for updates
        cardToProcess.date = this.card.date; // Preserve original date for updates

        try {
          // FIX: Pass the updated card data directly
          await this.updateExistingCard(cardToProcess);
          // FIX: No response.status check needed for local store actions
          this.$router.push(`/board/${boardId}`);
        } catch (error) {
          this.handleErrorResponse(error, "updating");
        } finally {
          this.isLoading = false;
        }
      }
    },
    cancelForm() {
      this.$router.push(`/board/${this.$route.params.boardID}`);
    },
    handleErrorResponse(error, verb) {
      // FIX: Adjust error message for local store errors
      if (error.message) { // Check for a specific error message from the store action
          this.errorMsg = `Error ${verb} card: ${error.message}`;
      } else if (error.response) {
        this.errorMsg = `Error ${verb} card. Response received was '${error.response.statusText}'.`;
      } else if (error.request) {
        this.errorMsg = `Error ${verb} card. Server could not be reached.`;
      } else {
        this.errorMsg = `Error ${verb} card. Request could not be created.`;
      }
      console.error(error);
    }
  },
  async created() {
    // FIX: Populate tag with a default if not already set, or if coming from a new card
    if (this.card.tag === "") {
        this.card.tag = "Feature Request"; // Set a default tag
    }

    if (this.cardID !== 0) { // If editing an existing card
      try {
        await this.fetchCardDetail(this.cardID);
        // FIX: Ensure currentCard is not null before spreading
        if (this.currentCard) {
          this.card = { ...this.currentCard }; // Use spread to create a copy, not a reference
        } else {
          // This case means fetchCardDetail committed null, handle it
          this.errorMsg = "Could not retrieve card details for editing.";
          // Optionally redirect
          // this.$router.push(`/board/${this.$route.params.boardID}`);
        }
      } catch (error) {
        // The fetchCardDetail action now throws an error if card not found
        // So this catch block should handle it directly.
        // No need for error.response.status === 404 check if store handles it.
        this.handleErrorResponse(error, "retrieving");
        // Redirect if card not found or serious error
        if (error.message === 'Card not found') {
            alert("Card not available. This card may have been deleted or you have entered an invalid card ID.");
            this.$router.push("/");
        }
      }
    }
  },
  computed: {
      ...mapGetters(['currentCard']) // Get the current card from the store
  },
  watch: {
    // Watch currentCard from the store. This is useful if the card
    // could be updated by another action while this form is open.
    currentCard: {
      handler(newCard) {
        // Only update local 'card' if we are in edit mode (cardID is not 0)
        // AND the newCard from the store is actually a card object (not null/empty)
        if (this.cardID !== 0 && newCard && Object.keys(newCard).length > 0) {
          // Merge to ensure we don't overwrite user changes if they're typing
          // but also ensure data from store populates.
          // For simplicity, just overwrite if you want the store to be the source of truth.
          this.card = { ...newCard };
        }
      },
      deep: true,
      immediate: false // No need for immediate as created() handles initial load
    }
  }
};
</script>

<style>
/* Styles remain the same */
.cardForm {
  padding: 10px;
  margin-bottom: 10px;
}
.form-group {
  margin-bottom: 10px;
  margin-top: 10px;
}
label {
  display: inline-block;
  margin-bottom: 0.5rem;
}
.form-control {
  display: block;
  width: 80%;
  height: 30px;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: #495057;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}
textarea.form-control {
  height: 75px;
  font-family: Arial, Helvetica, sans-serif;
}
select.form-control {
  width: 20%;
  display: inline-block;
  margin: 10px 20px 10px 10px;
}
.btn-submit {
  color: #fff;
  background-color: #0062cc;
  border-color: #005cbf;
}
.btn-cancel {
  color: #fff;
  background-color: #dc3545;
  border-color: #dc3545;
}
.status-message {
  display: block;
  border-radius: 5px;
  font-weight: bold;
  font-size: 1rem;
  text-align: center;
  padding: 10px;
  margin-bottom: 10px;
}
.status-message.success {
  background-color: #90ee90;
}
.status-message.error {
  background-color: #f08080;
}
</style>