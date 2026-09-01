<template>
  <div class="container">
    <header class="header">
      <div>
        <h1>Карьерный Навигатор</h1>
        <p class="subtitle">Цифровая экосистема вуза: программы, аналитика востребованности и профориентация</p>
      </div>
      <div v-if="user" class="user-badge">
        <span><strong>{{ user.full_name }}</strong> ({{ user.university_name }})</span>
        <button @click="logout" class="btn-sm btn-danger">Выйти</button>
      </div>
    </header>

    <!-- Форма входа -->
    <div v-if="!user" class="card auth-card">
      <h2>Вход в кабинет вуза</h2>
      <form @submit.prevent="login">
        <label>Email аккаунта</label>
        <input v-model="email" type="email" placeholder="hse@edu.ru" required />
        <label>Пароль</label>
        <input v-model="password" type="password" required />
        <button type="submit" class="btn-primary">Войти в кабинет</button>
      </form>
      <div class="demo-hints">
        <small>Демо-доступы: <code>hse@edu.ru</code>, <code>bmstu@edu.ru</code>, <code>inno@edu.ru</code> (пароль: <code>password123</code>)</small>
      </div>
    </div>

    <!-- Основной дашборд -->
    <div v-else class="dashboard">
      <!-- Навигационные вкладки -->
      <div class="tabs">
        <button :class="{ active: currentTab === 'programs' }" @click="currentTab = 'programs'">Управление программами</button>
        <button :class="{ active: currentTab === 'analytics' }" @click="renderChartsTab">Аналитика и трудоустройство</button>
        <button :class="{ active: currentTab === 'quiz' }" @click="currentTab = 'quiz'">Экспресс-тест абитуриента</button>
      </div>

      <!-- Вкладка 1: Программы (CRUD, Поиск) -->
      <div v-if="currentTab === 'programs'">
        <div class="card form-card">
          <h2>{{ isEditing ? 'Редактирование программы' : 'Публикация новой образовательной программы' }}</h2>
          <form @submit.prevent="saveProgram" class="grid-form">
            <div>
              <label>Название программы</label>
              <input v-model="formData.title" placeholder="например, Искусственный интеллект" required />
            </div>

            <div>
              <label>Связанная профессия рынка</label>
              <select v-model="formData.profession_id" required>
                <option value="" disabled>Выберите профессию</option>
                <option v-for="prof in professions" :key="prof.id" :value="prof.id">
                  {{ prof.title }} (Рын. зарплата: {{ prof.average_salary }} ₽)
                </option>
              </select>
            </div>

            <div>
              <label>Минимальные баллы ЕГЭ</label>
              <input v-model="formData.ege_requirements" placeholder="Математика: 80, Информатика: 85" required />
            </div>

            <div class="row-2">
              <div>
                <label>Проходной балл</label>
                <input v-model="formData.passing_score" type="number" placeholder="280" required />
              </div>
              <div>
                <label>Трудоустройство (%)</label>
                <input v-model="formData.employment_rate" type="number" min="0" max="100" placeholder="95" required />
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">{{ isEditing ? 'Сохранить изменения' : 'Опубликовать программу' }}</button>
              <button v-if="isEditing" type="button" @click="cancelEdit" class="btn-secondary">Отмена</button>
            </div>
          </form>
        </div>

        <div class="card">
          <div class="list-top">
            <h2>Опубликованные направления ({{ filteredPrograms.length }})</h2>
            <input v-model="searchQuery" class="search-input" placeholder="Поиск по названию или компетенциям..." />
          </div>

          <div v-if="filteredPrograms.length === 0" class="empty-state">Программы не найдены</div>
          <div v-else class="programs-grid">
            <div v-for="prog in filteredPrograms" :key="prog.id" class="prog-card">
              <div class="prog-header">
                <h3>{{ prog.title }}</h3>
                <span class="badge badge-score">{{ prog.passing_score }} баллов</span>
              </div>

              <p class="meta-item"><strong>ЕГЭ:</strong> {{ prog.ege_requirements }}</p>

              <div class="stat-bar-container">
                <div class="stat-label">
                  <span>Трудоустройство выпускников:</span>
                  <strong>{{ prog.employment_rate }}%</strong>
                </div>
                <div class="progress-bg">
                  <div class="progress-fill" :style="{ width: prog.employment_rate + '%' }"></div>
                </div>
              </div>

              <div class="market-box">
                <div class="market-title">Востребованность на рынке:</div>
                <div><strong>Профессия:</strong> {{ prog.profession_title }}</div>
                <div><strong>Медианная зарплата:</strong> {{ prog.average_salary }} ₽/мес</div>
                <div class="skills"><strong>Компетенции:</strong> {{ prog.required_competencies }}</div>
              </div>

              <div class="card-footer">
                <button @click="startEdit(prog)" class="btn-sm btn-edit">Редактировать</button>
                <button @click="deleteProgram(prog.id)" class="btn-sm btn-delete">Удалить</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Вкладка 2: Графики и аналитика -->
      <div v-if="currentTab === 'analytics'" class="card">
        <h2>Аналитический дашборд востребованности и трудоустройства</h2>
        <div class="charts-wrapper">
          <div class="chart-container">
            <h3>Процент трудоустройства по программам (%)</h3>
            <canvas id="employmentChart"></canvas>
          </div>
          <div class="chart-container">
            <h3>Потенциальный доход выпускников (₽)</h3>
            <canvas id="salaryChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Вкладка 3: Тест абитуриента -->
      <div v-if="currentTab === 'quiz'" class="card quiz-card">
        <h2>Интерактивный подбор программ для абитуриента</h2>
        <p class="subtitle">Ответьте на вопросы, чтобы система подобрала программы вашего вуза под интересы студента</p>

        <div v-if="!quizFinished" class="quiz-step">
          <h3>Вопрос: Какая сфера цифровых технологий вам ближе всего?</h3>
          <div class="options-list">
            <button @click="submitQuizAnswer(1)" class="quiz-btn">1. Разработка современных веб-сервисов и приложений</button>
            <button @click="submitQuizAnswer(2)" class="quiz-btn">2. Искусственный интеллект, алгоритмы и анализ данных</button>
            <button @click="submitQuizAnswer(3)" class="quiz-btn">3. Информационная безопасность и защита инфраструктуры</button>
            <button @click="submitQuizAnswer(5)" class="quiz-btn">4. Управление ИТ-продуктами и бизнес-анализ</button>
          </div>
        </div>

        <div v-else class="quiz-result">
          <h3>Рекомендованные программы вуза:</h3>
          <div v-if="recommendedPrograms.length === 0" class="empty-state">
            В вашем вузе пока не зарегистрированы программы по этому профилю.
          </div>
          <div v-else class="programs-grid">
            <div v-for="item in recommendedPrograms" :key="item.id" class="prog-card">
              <h4>{{ item.title }}</h4>
              <p>Целевая профессия: <strong>{{ item.profession_title }}</strong></p>
              <p>Трудоустройство: <strong>{{ item.employment_rate }}%</strong></p>
            </div>
          </div>
          <button @click="quizFinished = false" class="btn-secondary" style="margin-top: 16px;">Пройти заново</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Chart from 'chart.js/auto';

const API_URL = 'http://localhost:5000/api';

export default {
  data() {
    return {
      user: null,
      email: 'hse@edu.ru',
      password: 'password123',
      currentTab: 'programs',
      professions: [],
      programs: [],
      searchQuery: '',
      isEditing: false,
      editingId: null,
      formData: {
        title: '',
        profession_id: '',
        ege_requirements: '',
        passing_score: '',
        employment_rate: ''
      },
      quizFinished: false,
      recommendedPrograms: [],
      empChartInstance: null,
      salChartInstance: null
    };
  },
  computed: {
    filteredPrograms() {
      if (!this.searchQuery.trim()) return this.programs;
      const q = this.searchQuery.toLowerCase();
      return this.programs.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.required_competencies.toLowerCase().includes(q) ||
          p.profession_title.toLowerCase().includes(q)
      );
    }
  },
  methods: {
    async login() {
      try {
        const res = await axios.post(`${API_URL}/auth/login`, {
          email: this.email,
          password: this.password
        });
        this.user = res.data.user;
        await this.loadInitialData();
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка входа');
      }
    },
    logout() {
      this.user = null;
      this.programs = [];
    },
    async loadInitialData() {
      const [profRes, progRes] = await Promise.all([
        axios.get(`${API_URL}/professions`),
        axios.get(`${API_URL}/university/${this.user.university_id}/programs`)
      ]);
      this.professions = profRes.data;
      this.programs = progRes.data;
    },
    async saveProgram() {
      try {
        if (this.isEditing) {
          await axios.put(`${API_URL}/programs/${this.editingId}`, this.formData);
          alert('Программа успешно обновлена!');
        } else {
          await axios.post(`${API_URL}/programs`, {
            university_id: this.user.university_id,
            ...this.formData
          });
          alert('Программа успешно опубликована!');
        }
        this.cancelEdit();
        await this.loadInitialData();
      } catch (err) {
        alert('Ошибка при сохранении данных');
      }
    },
    startEdit(prog) {
      this.isEditing = true;
      this.editingId = prog.id;
      this.formData = {
        title: prog.title,
        profession_id: prog.profession_id,
        ege_requirements: prog.ege_requirements,
        passing_score: prog.passing_score,
        employment_rate: prog.employment_rate
      };
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    cancelEdit() {
      this.isEditing = false;
      this.editingId = null;
      this.formData = { title: '', profession_id: '', ege_requirements: '', passing_score: '', employment_rate: '' };
    },
    async deleteProgram(id) {
      if (!confirm('Вы уверены, что хотите удалить эту программу?')) return;
      try {
        await axios.delete(`${API_URL}/programs/${id}`);
        await this.loadInitialData();
      } catch (err) {
        alert('Ошибка удаления');
      }
    },
    renderChartsTab() {
      this.currentTab = 'analytics';
      this.$nextTick(() => {
        this.renderCharts();
      });
    },
    renderCharts() {
      if (this.empChartInstance) this.empChartInstance.destroy();
      if (this.salChartInstance) this.salChartInstance.destroy();

      const labels = this.programs.map(p => p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title);
      const employmentData = this.programs.map(p => p.employment_rate);
      const salaryData = this.programs.map(p => p.average_salary);

      const empCtx = document.getElementById('employmentChart');
      if (empCtx) {
        this.empChartInstance = new Chart(empCtx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Трудоустройство (%)',
              data: employmentData,
              backgroundColor: '#3b82f6'
            }]
          },
          options: { responsive: true, scales: { y: { min: 50, max: 100 } } }
        });
      }

      const salCtx = document.getElementById('salaryChart');
      if (salCtx) {
        this.salChartInstance = new Chart(salCtx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Зарплата специалиста (₽)',
              data: salaryData,
              borderColor: '#10b981',
              tension: 0.3,
              fill: true,
              backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }]
          },
          options: { responsive: true }
        });
      }
    },
    submitQuizAnswer(targetProfessionId) {
      this.recommendedPrograms = this.programs.filter(p => p.profession_id === targetProfessionId);
      this.quizFinished = true;
    }
  }
};
</script>

<style>
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #0b132b; color: #f8fafc; }
.container { max-width: 1080px; margin: 0 auto; padding: 32px 16px; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px; }
h1 { margin: 0; font-size: 26px; color: #60a5fa; }
.subtitle { margin: 4px 0 0 0; color: #94a3b8; font-size: 14px; }
.user-badge { display: flex; align-items: center; gap: 12px; background: #1e293b; padding: 8px 16px; border-radius: 8px; font-size: 14px; }
.tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #334155; padding-bottom: 8px; }
.tabs button { background: none; border: none; color: #94a3b8; font-weight: 600; padding: 10px 18px; cursor: pointer; border-radius: 6px; }
.tabs button.active { background: #1e293b; color: #38bdf8; }
.card { background: #1c2541; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155; }
.auth-card { max-width: 420px; margin: 60px auto; }
.grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.row-2 { display: flex; gap: 12px; }
.row-2 > div { flex: 1; }
label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 4px; }
input, select { width: 100%; box-sizing: border-box; padding: 10px 14px; background: #0b132b; border: 1px solid #475569; border-radius: 6px; color: #fff; }
.form-actions { grid-column: span 2; display: flex; gap: 12px; margin-top: 8px; }
.btn-primary { background: #2563eb; color: #fff; border: none; padding: 12px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-secondary { background: #475569; color: #fff; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; }
.btn-sm { padding: 6px 12px; border-radius: 4px; border: none; cursor: pointer; font-size: 12px; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-edit { background: #f59e0b; color: #000; font-weight: 600; }
.btn-delete { background: #dc2626; color: #fff; }
.list-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.search-input { width: 320px; }
.programs-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
.prog-card { background: #0b132b; border: 1px solid #334155; border-radius: 8px; padding: 18px; }
.prog-header { display: flex; justify-content: space-between; align-items: flex-start; }
.badge { padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 600; }
.badge-score { background: #059669; color: #fff; }
.stat-bar-container { margin: 12px 0; }
.stat-label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
.progress-bg { width: 100%; height: 8px; background: #334155; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: #38bdf8; }
.market-box { background: #1e293b; padding: 12px; border-radius: 6px; font-size: 13px; margin: 12px 0; line-height: 1.6; }
.market-title { color: #f59e0b; font-weight: 600; margin-bottom: 4px; }
.card-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.charts-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px; }
.chart-container { background: #0b132b; padding: 16px; border-radius: 8px; }
.options-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.quiz-btn { background: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 14px 20px; text-align: left; border-radius: 8px; cursor: pointer; font-size: 15px; }
.quiz-btn:hover { background: #2563eb; border-color: #2563eb; }
.demo-hints { margin-top: 16px; text-align: center; color: #94a3b8; }
.empty-state { text-align: center; padding: 24px; color: #94a3b8; }
</style>