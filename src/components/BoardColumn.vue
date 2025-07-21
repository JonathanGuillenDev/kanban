<template>
  <div class="board">
    <h2>{{ title }}</h2>
    <div class="cards">
      <div
        class="card"
        v-for="card in cardsForThisColumn" v-bind:key="card.id"
        v-on:click="viewCardDetails(card.id)"
      >
        <div class="header">
          <h3>{{ card.title }}</h3>
        </div>
        <div class="footer">
          <span class="date">{{ card.date }}</span>
          <span class="pill" :class="getTagClass(card.tag)">{{
            card.tag
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'board-column',
  props: ['title', 'boardID', 'columnStatus'],
  computed: {
    ...mapGetters(['getCardsForBoard']), // Map the getter
    cardsForThisColumn() {
      // Filter cards from the store based on boardID and columnStatus
      // Note: getCardsForBoard already gives you cards for the specific board
      return this.getCardsForBoard(this.boardID).filter(card => card.status === this.columnStatus);
    }
  },
  methods: {
    viewCardDetails(cardID) {
      this.$router.push(`/board/${this.boardID}/card/${cardID}`);
    },
    getTagClass(tag) {
      let clazz = '';
      switch (tag) {
        case 'Feature Request':
          clazz = 'feature';
          break;
        case 'Design':
          clazz = 'design';
          break;
        case 'Q&A':
          clazz = 'qa';
          break;
        default:
          clazz = 'default-tag';
      }
      return clazz;
    }
  }
};
</script>

<style scoped>
/* Styles remain the same */
.board {
  background-color: #919394;
  border-radius: 10px;
  padding: 0 20px 20px 20px;
}
.card {
  background: #e2e2e2;
  border-radius: 0.25rem;
  padding: 10px;
  border: 1px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  margin-bottom: 10px;
  cursor: pointer;
}
.card:last-child {
  margin-bottom: 0px;
}
.card h3 {
  margin-top: 0px;
  font-size: 0.875rem;
}
.card .header {
  display: flex;
  justify-content: space-between;
}
.card .header img {
  border-radius: 9999px;
  width: 32px;
  align-self: flex-start;
}
.card .footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0 10px 0;
  font-size: 0.75rem;
}
.pill {
  padding: 8px;
  border-radius: 20px;
  font-size: 0.7rem;
}
.design {
  background-color: #faf5ff;
  color: #6b46c1;
}
.qa {
  background-color: #f0fff4;
  color: #2c7a7b;
}

.feature {
  background-color: #e6fffa;
  color: #2c7a7b;
}
/* Optional: Add a default tag style */
.default-tag {
  background-color: #e2e8f0; /* Light gray */
  color: #4a5568; /* Darker gray text */
}
</style>