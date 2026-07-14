package pro.svoiprox.parih.client

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column as LayoutColumn
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.net.URLEncoder
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale
import java.util.concurrent.TimeUnit

private val Context.dataStore by preferencesDataStore("prestige_client")

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PrestigeApp()
        }
    }
}

@Composable
private fun PrestigeApp() {
    val context = LocalContext.current
    val api = remember { PrestigeApi(BuildConfig.PUBLIC_BASE_URL) }
    val store = remember { ClientStore(context) }
    val savedClient by store.client.collectAsState(initial = ClientProfile())
    val scope = rememberCoroutineScope()
    var tab by remember { mutableStateOf(AppTab.Home) }
    var preselectedService by remember { mutableStateOf<Service?>(null) }

    MaterialTheme(colorScheme = prestigeColors) {
        Scaffold(
            containerColor = Cream,
            bottomBar = {
                NavigationBar(containerColor = SurfaceWarm) {
                    AppTab.entries.forEach { item ->
                        NavigationBarItem(
                            selected = tab == item,
                            onClick = { tab = item },
                            icon = { Text(item.icon, fontSize = 18.sp) },
                            label = { Text(item.label) }
                        )
                    }
                }
            }
        ) { padding ->
            Surface(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                color = Cream
            ) {
                when (tab) {
                    AppTab.Home -> HomeScreen(
                        api = api,
                        store = store,
                        onBook = {
                            preselectedService = null
                            tab = AppTab.Booking
                        },
                        onDetails = { tab = AppTab.MyAppointment }
                    )

                    AppTab.Services -> ServicesScreen(
                        api = api,
                        onBook = {
                            preselectedService = it
                            tab = AppTab.Booking
                        }
                    )

                    AppTab.Booking -> BookingScreen(
                        api = api,
                        store = store,
                        savedClient = savedClient,
                        initialService = preselectedService,
                        onBooked = {
                            scope.launch { store.saveToken(it) }
                            tab = AppTab.MyAppointment
                        }
                    )

                    AppTab.MyAppointment -> MyAppointmentScreen(api = api, store = store)
                }
            }
        }
    }
}

@Composable
private fun HomeScreen(
    api: PrestigeApi,
    store: ClientStore,
    onBook: () -> Unit,
    onDetails: () -> Unit
) {
    val token by store.token.collectAsState(initial = "")
    var salon by remember { mutableStateOf<SalonInfo?>(null) }
    var appointment by remember { mutableStateOf<Appointment?>(null) }
    var error by remember { mutableStateOf("") }

    LaunchedEffect(token) {
        runCatching {
            salon = api.getSalon()
            if (token.isNotBlank()) appointment = api.getAppointment(token)
        }.onFailure {
            error = "Нет подключения. Проверьте интернет и попробуйте снова."
        }
    }

    ScreenList {
        Text("Зеркала", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
        Text("Стрижки без лишних слов", color = PrimaryDark, fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text(
            salon?.description
                ?: "Мужские и женские стрижки по предварительной записи.",
            color = Muted
        )
        PrimaryButton("Записаться онлайн", onBook)
        if (appointment != null) {
            SectionCard {
                Text("Ближайшая запись", color = Primary, fontWeight = FontWeight.Bold)
                Text("${appointment!!.date} · ${appointment!!.time}", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text("${appointment!!.master} · ${appointment!!.service}")
                StatusChip(appointment!!.status)
                OutlinedButton(onClick = onDetails) { Text("Подробнее") }
            }
        }
        InfoRow("Режим работы", salon?.workingHours ?: "ежедневно 09:00-21:00")
        InfoRow("Телефон", salon?.phone ?: "+7 900 123-45-67")
        if (error.isNotBlank()) ErrorCard(error)
    }
}

@Composable
private fun ServicesScreen(api: PrestigeApi, onBook: (Service) -> Unit) {
    var services by remember { mutableStateOf<List<Service>>(emptyList()) }
    var error by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        runCatching { services = api.getServices() }
            .onFailure { error = "Нет подключения. Не удалось загрузить услуги." }
    }

    ScreenList {
        Text("Услуги", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
        if (error.isNotBlank()) ErrorCard(error)
        services.forEach { service ->
            SectionCard {
                Text(serviceIcon(service.icon), fontSize = 24.sp)
                Text(service.title, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text(service.description, color = Muted)
                Text("${service.priceLabel} · ${service.durationLabel}", color = PrimaryDark, fontWeight = FontWeight.Bold)
                if (service.isBookable) {
                    PrimaryButton("Записаться") { onBook(service) }
                } else {
                    Text("Запись и стоимость уточняются по телефону", color = PrimaryDark, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun BookingScreen(
    api: PrestigeApi,
    store: ClientStore,
    savedClient: ClientProfile,
    initialService: Service?,
    onBooked: (String) -> Unit
) {
    val scope = rememberCoroutineScope()
    var step by remember { mutableIntStateOf(1) }
    var name by remember { mutableStateOf(savedClient.name) }
    var phone by remember { mutableStateOf(savedClient.phone) }
    var services by remember { mutableStateOf<List<Service>>(emptyList()) }
    var selectedService by remember { mutableStateOf(initialService) }
    var selectedDate by remember { mutableStateOf<LocalDate?>(null) }
    var masters by remember { mutableStateOf<List<Master>>(emptyList()) }
    var selectedMaster by remember { mutableStateOf<Master?>(null) }
    var slots by remember { mutableStateOf<List<String>>(emptyList()) }
    var selectedTime by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        runCatching {
            services = api.getServices().filter { it.isBookable }
            if (selectedService == null) selectedService = services.firstOrNull()
        }.onFailure { message = "Нет подключения. Не удалось загрузить услуги." }
    }

    LaunchedEffect(selectedDate, selectedService) {
        selectedMaster = null
        selectedTime = ""
        slots = emptyList()
        val date = selectedDate ?: return@LaunchedEffect
        val service = selectedService ?: return@LaunchedEffect
        runCatching { masters = api.getMasters(date.toString(), service.slug) }
            .onFailure { message = "Не удалось загрузить мастеров на смене." }
    }

    LaunchedEffect(selectedService, selectedDate, selectedMaster) {
        selectedTime = ""
        val service = selectedService ?: return@LaunchedEffect
        val date = selectedDate ?: return@LaunchedEffect
        val master = selectedMaster ?: return@LaunchedEffect
        runCatching { slots = api.getAvailability(date.toString(), master.name, service.slug) }
            .onFailure { message = "Не удалось загрузить свободное время." }
    }

    ScreenList {
        Text("Онлайн-запись", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
        Text("Шаг $step из 6", color = Primary, fontWeight = FontWeight.Bold)
        if (message.isNotBlank()) ErrorCard(message)

        when (step) {
            1 -> SectionCard {
                Text("Данные клиента", fontSize = 24.sp, fontWeight = FontWeight.Bold)
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Имя") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = formatPhone(it) },
                    label = { Text("Номер телефона") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth()
                )
                PrimaryButton("Далее") {
                    if (name.isBlank() || !phone.matches(Regex("""\+7 \d{3} \d{3}-\d{2}-\d{2}"""))) {
                        message = "Введите имя и телефон в формате +7 900 000-00-00."
                    } else {
                        message = ""
                        scope.launch { store.saveClient(name, phone) }
                        step = 2
                    }
                }
            }

            2 -> SelectServiceStep(services, selectedService) {
                selectedService = it
                step = 3
            }

            3 -> DateStep(selectedDate) {
                selectedDate = it
                step = 4
            }

            4 -> SelectMasterStep(masters, selectedMaster) {
                selectedMaster = it
                step = 5
            }

            5 -> TimeStep(slots, selectedTime) {
                selectedTime = it
                step = 6
            }

            6 -> ConfirmStep(name, phone, selectedService, selectedMaster, selectedDate, selectedTime) {
                val service = selectedService ?: return@ConfirmStep
                val master = selectedMaster ?: return@ConfirmStep
                val date = selectedDate ?: return@ConfirmStep
                scope.launch {
                    runCatching {
                        api.createAppointment(
                            CreateAppointmentRequest(name, phone, service.title, master.name, date.toString(), selectedTime, service.duration, service.price)
                        )
                    }.onSuccess {
                        onBooked(it.publicToken)
                    }.onFailure {
                        message = if (it.message?.contains("409") == true) {
                            "Это время только что заняли. Пожалуйста, выберите другое свободное время."
                        } else {
                            "Не удалось создать запись. Попробуйте снова."
                        }
                        step = 5
                    }
                }
            }
        }
    }
}

@Composable
private fun SelectServiceStep(services: List<Service>, selected: Service?, onSelect: (Service) -> Unit) {
    LayoutColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Выберите услугу", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        services.forEach { service ->
            SelectCard(selected?.title == service.title, onClick = { onSelect(service) }) {
                Text(service.title, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Text(service.description, color = Muted)
                Text("${service.priceLabel} · ${service.durationLabel}", color = PrimaryDark, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun DateStep(selected: LocalDate?, onSelect: (LocalDate) -> Unit) {
    val dates = remember { (0..20).map { LocalDate.now().plusDays(it.toLong()) } }
    LayoutColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Выберите дату", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items(dates) { date ->
                SelectCard(selected == date, modifier = Modifier.width(104.dp), onClick = { onSelect(date) }) {
                    Text(date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale("ru")), color = Muted)
                    Text(date.dayOfMonth.toString(), fontSize = 28.sp, fontWeight = FontWeight.Bold)
                    Text(date.month.getDisplayName(TextStyle.SHORT, Locale("ru")))
                }
            }
        }
    }
}

@Composable
private fun SelectMasterStep(masters: List<Master>, selected: Master?, onSelect: (Master) -> Unit) {
    LayoutColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Мастера на смене", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        if (masters.isEmpty()) {
            ErrorCard("На выбранную дату мастеров на смене нет. Выберите другой день.")
        }
        masters.forEach { master ->
            SelectCard(selected?.name == master.name, onClick = { onSelect(master) }) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RemoteAvatar(master.image)
                    Spacer(Modifier.width(12.dp))
                    LayoutColumn {
                        Text(master.name, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Text(master.role, color = Muted)
                        Text("${master.experience} · На смене", color = PrimaryDark, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun TimeStep(slots: List<String>, selected: String, onSelect: (String) -> Unit) {
    LayoutColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Свободное время", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        if (slots.isEmpty()) ErrorCard("Свободных слотов нет. Выберите другую дату или мастера.")
        slots.chunked(3).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { slot ->
                    SelectCard(selected == slot, modifier = Modifier.weight(1f), onClick = { onSelect(slot) }) {
                        Text(slot, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ConfirmStep(
    name: String,
    phone: String,
    service: Service?,
    master: Master?,
    date: LocalDate?,
    time: String,
    onConfirm: () -> Unit
) {
    SectionCard {
        Text("Ваша запись", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        InfoRow("Имя", name)
        InfoRow("Телефон", phone)
        InfoRow("Услуга", service?.title.orEmpty())
        InfoRow("Мастер", master?.name.orEmpty())
        InfoRow("Дата", date?.format(DateTimeFormatter.ISO_DATE).orEmpty())
        InfoRow("Время", time)
        InfoRow("Стоимость", service?.priceLabel.orEmpty())
        InfoRow("Длительность", service?.durationLabel.orEmpty())
        PrimaryButton("Подтвердить запись", onConfirm)
    }
}

@Composable
private fun MyAppointmentScreen(api: PrestigeApi, store: ClientStore) {
    val token by store.token.collectAsState(initial = "")
    var appointment by remember { mutableStateOf<Appointment?>(null) }
    var message by remember { mutableStateOf("") }

    fun load(scope: kotlinx.coroutines.CoroutineScope) {
        if (token.isBlank()) {
            message = "У вас пока нет сохраненной записи."
            return
        }
        scope.launch {
            runCatching { api.getAppointment(token) }
                .onSuccess {
                    appointment = it
                    store.saveCachedAppointment(it)
                    message = ""
                }
                .onFailure {
                    appointment = store.readCachedAppointment()
                    message = "Нет подключения. Показаны последние сохраненные данные."
                }
        }
    }

    val scope = rememberCoroutineScope()
    LaunchedEffect(token) { load(scope) }

    ScreenList {
        Text("Моя запись", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
        if (message.isNotBlank()) ErrorCard(message)
        appointment?.let {
            SectionCard {
                InfoRow("Услуга", it.service)
                InfoRow("Мастер", it.master)
                InfoRow("Дата", it.date)
                InfoRow("Время", it.time)
                InfoRow("Стоимость", "${it.price ?: 0} ₽")
                InfoRow("Длительность", "${it.duration} мин")
                StatusChip(it.status)
                OutlinedButton(onClick = { load(scope) }) { Text("Обновить") }
            }
        }
    }
}

@Composable
private fun ScreenList(content: @Composable ColumnScope.() -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            LayoutColumn(verticalArrangement = Arrangement.spacedBy(14.dp), content = content)
        }
    }
}

@Composable
private fun SectionCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceWarm),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(28.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        LayoutColumn(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp), content = content)
    }
}

@Composable
private fun SelectCard(
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    LayoutColumn(
        modifier
            .clip(RoundedCornerShape(24.dp))
            .background(if (selected) PrimarySoft else SurfaceWarm)
            .border(1.dp, if (selected) Primary else Line, RoundedCornerShape(24.dp))
            .clickable(onClick = onClick)
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        content = content
    )
}

@Composable
private fun PrimaryButton(text: String, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = Primary),
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(54.dp)
    ) {
        Text(text, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = Muted)
        Text(value, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ErrorCard(text: String) {
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFFFDE9E2))
            .padding(14.dp)
    ) {
        Text(text, color = Color(0xFF903426), fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun StatusChip(status: String) {
    val label = when (status) {
        "new" -> "Ожидает подтверждения"
        "confirmed" -> "Запись подтверждена"
        "cancelled" -> "Запись отменена"
        "completed" -> "Посещение завершено"
        else -> status
    }
    Text(label, color = PrimaryDark, fontWeight = FontWeight.Bold)
}

@Composable
private fun RemoteAvatar(url: String) {
    var bitmap by remember(url) { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(url) {
        bitmap = ImageCache.load(url)
    }
    Box(
        Modifier
            .size(64.dp)
            .clip(CircleShape)
            .background(PrimarySoft),
        contentAlignment = Alignment.Center
    ) {
        bitmap?.let {
            Image(
                bitmap = it.asImageBitmap(),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } ?: Text("СП", color = PrimaryDark, fontWeight = FontWeight.Bold)
    }
}

private enum class AppTab(val label: String, val icon: String) {
    Home("Главная", "⌂"),
    Services("Услуги", "✂"),
    Booking("Запись", "＋"),
    MyAppointment("Моя запись", "✓")
}

private val Cream = Color(0xFFFAF6F1)
private val SurfaceWarm = Color(0xFFFFFDF9)
private val Primary = Color(0xFFA85D4B)
private val PrimaryDark = Color(0xFF6F382E)
private val PrimarySoft = Color(0xFFF1DDD5)
private val Accent = Color(0xFFD8B98C)
private val TextDark = Color(0xFF241F1C)
private val Muted = Color(0xFF7A6F68)
private val Line = Color(0x226F382E)

private val prestigeColors = lightColorScheme(
    primary = Primary,
    secondary = Accent,
    background = Cream,
    surface = SurfaceWarm,
    onPrimary = Color.White,
    onSurface = TextDark
)

private data class SalonInfo(val description: String, val workingHours: String, val phone: String)
private data class Service(val slug: String, val icon: String, val title: String, val price: Int, val priceLabel: String, val duration: Int, val durationLabel: String, val description: String, val isBookable: Boolean)
private data class Master(val name: String, val role: String, val experience: String, val image: String)
private data class Appointment(val service: String, val master: String, val date: String, val time: String, val price: Int?, val duration: Int, val status: String)
private data class ClientProfile(val name: String = "", val phone: String = "")
private data class CreateAppointmentRequest(val name: String, val phone: String, val service: String, val master: String, val date: String, val time: String, val duration: Int, val price: Int)
private data class CreatedAppointment(val publicToken: String)

private class PrestigeApi(private val baseUrl: String) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    suspend fun getSalon(): SalonInfo = withContext(Dispatchers.IO) {
        val json = getJson("/api/public/salon")
        SalonInfo(json.getString("description"), json.getString("workingHours"), json.getString("phone"))
    }

    suspend fun getServices(): List<Service> = withContext(Dispatchers.IO) {
        getJson("/api/public/services").getJSONArray("services").mapObjects {
            Service(
                slug = it.getString("slug"),
                icon = it.getString("icon"),
                title = it.getString("title"),
                price = it.getInt("price"),
                priceLabel = it.getString("priceLabel"),
                duration = it.getInt("duration"),
                durationLabel = it.getString("durationLabel"),
                description = it.getString("description"),
                isBookable = it.optBoolean("isBookable", true)
            )
        }
    }

    suspend fun getMasters(date: String, service: String): List<Master> = withContext(Dispatchers.IO) {
        val encodedDate = URLEncoder.encode(date, "UTF-8")
        val encodedService = URLEncoder.encode(service, "UTF-8")
        getJson("/api/public/masters?date=$encodedDate&service=$encodedService").getJSONArray("masters").mapObjects {
            Master(it.getString("name"), it.getString("role"), it.getString("experience"), it.getString("image"))
        }
    }

    suspend fun getAvailability(date: String, master: String, service: String): List<String> = withContext(Dispatchers.IO) {
        val path = "/api/availability?date=${encode(date)}&master=${encode(master)}&service=${encode(service)}"
        getJson(path).getJSONArray("availableSlots").mapStrings()
    }

    suspend fun createAppointment(request: CreateAppointmentRequest): CreatedAppointment = withContext(Dispatchers.IO) {
        val payload = JSONObject()
            .put("name", request.name)
            .put("phone", request.phone)
            .put("service", request.service)
            .put("master", request.master)
            .put("date", request.date)
            .put("time", request.time)
            .put("duration", request.duration)
            .put("price", request.price)
        val json = postJson("/api/appointments", payload)
        CreatedAppointment(json.getJSONObject("appointment").getString("publicToken"))
    }

    suspend fun getAppointment(token: String): Appointment = withContext(Dispatchers.IO) {
        val json = getJson("/api/public/appointments/by-token/${encode(token)}").getJSONObject("appointment")
        Appointment(
            service = json.getString("service"),
            master = json.getString("master"),
            date = json.getString("date"),
            time = json.getString("time"),
            price = if (json.isNull("price")) null else json.getInt("price"),
            duration = json.getInt("duration"),
            status = json.getString("status")
        )
    }

    private fun getJson(path: String): JSONObject {
        val request = Request.Builder().url(baseUrl.trimEnd('/') + path).get().build()
        return executeJson(request)
    }

    private fun postJson(path: String, payload: JSONObject): JSONObject {
        val request = Request.Builder()
            .url(baseUrl.trimEnd('/') + path)
            .post(payload.toString().toRequestBody("application/json; charset=utf-8".toMediaType()))
            .build()
        return executeJson(request)
    }

    private fun executeJson(request: Request): JSONObject {
        client.newCall(request).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) throw IllegalStateException("${response.code}: $body")
            return JSONObject(body)
        }
    }

    private fun encode(value: String) = URLEncoder.encode(value, "UTF-8")
}

private class ClientStore(private val context: Context) {
    private val nameKey = stringPreferencesKey("name")
    private val phoneKey = stringPreferencesKey("phone")
    private val tokenKey = stringPreferencesKey("public_token")
    private val appointmentKey = stringPreferencesKey("cached_appointment")

    val client: Flow<ClientProfile> = context.dataStore.data.map {
        ClientProfile(it[nameKey].orEmpty(), it[phoneKey].orEmpty())
    }
    val token: Flow<String> = context.dataStore.data.map { it[tokenKey].orEmpty() }

    suspend fun saveClient(name: String, phone: String) {
        context.dataStore.edit {
            it[nameKey] = name
            it[phoneKey] = phone
        }
    }

    suspend fun saveToken(token: String) {
        context.dataStore.edit { it[tokenKey] = token }
    }

    suspend fun saveCachedAppointment(appointment: Appointment) {
        val json = JSONObject()
            .put("service", appointment.service)
            .put("master", appointment.master)
            .put("date", appointment.date)
            .put("time", appointment.time)
            .put("price", appointment.price)
            .put("duration", appointment.duration)
            .put("status", appointment.status)
        context.dataStore.edit { it[appointmentKey] = json.toString() }
    }

    suspend fun readCachedAppointment(): Appointment? {
        val prefs = context.dataStore.data.map { it[appointmentKey] }.firstOrNull()
        val json = prefs?.let { JSONObject(it) } ?: return null
        return Appointment(
            json.getString("service"),
            json.getString("master"),
            json.getString("date"),
            json.getString("time"),
            if (json.isNull("price")) null else json.getInt("price"),
            json.getInt("duration"),
            json.getString("status")
        )
    }
}

private object ImageCache {
    private val client = OkHttpClient()
    private val cache = mutableMapOf<String, Bitmap>()

    suspend fun load(url: String): Bitmap? = withContext(Dispatchers.IO) {
        cache[url] ?: runCatching {
            val request = Request.Builder().url(url).build()
            client.newCall(request).execute().use { response ->
                val bytes = response.body?.bytes() ?: return@use null
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            }
        }.getOrNull()?.also { cache[url] = it }
    }
}

private fun JSONArray.mapStrings(): List<String> = List(length()) { index -> getString(index) }
private fun <T> JSONArray.mapObjects(block: (JSONObject) -> T): List<T> = List(length()) { index -> block(getJSONObject(index)) }

private fun serviceIcon(icon: String): String = when (icon) {
    "scissors" -> "✂"
    "sparkles" -> "✦"
    "heart" -> "♡"
    "palette" -> "◉"
    "waves" -> "≋"
    "leaf" -> "⌁"
    "hand" -> "◇"
    "activity" -> "≈"
    "eye" -> "◌"
    else -> "✦"
}

private fun formatPhone(raw: String): String {
    val digits = raw.filter { it.isDigit() }.removePrefix("8").removePrefix("7").let { "7$it" }.take(11)
    val p1 = digits.drop(1).take(3)
    val p2 = digits.drop(4).take(3)
    val p3 = digits.drop(7).take(2)
    val p4 = digits.drop(9).take(2)
    return buildString {
        append("+7")
        if (p1.isNotBlank()) append(" $p1")
        if (p2.isNotBlank()) append(" $p2")
        if (p3.isNotBlank()) append("-$p3")
        if (p4.isNotBlank()) append("-$p4")
    }
}
